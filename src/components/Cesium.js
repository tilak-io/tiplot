import { useState, useEffect } from "react";
import "../css/cesium.css";

function Cesium() {
  // access window variables to use the Cesium API
  var Cesium = window.Cesium;
  var viewer = window.viewer;

  // States
  const [entitiesArray, setEntities] = useState([]);
  const [isLoaded, setLoaded] = useState(false);
  const [isInitialized, setInitialized] = useState(false);

  useEffect(() => {
    // get position and orientation arrays
    fetchData();
    if (!isLoaded) return;
    if (!isInitialized) {
      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiY2JkNjc2MS0yMWQwLTQ3MDMtOTg1NS0yZTBiZTgyNTI4YzgiLCJpZCI6MTA3MTk5LCJpYXQiOjE2NjI0NjUzMjh9.fQ0ozGXNo7UtrbFUFqQ6GXKfPJDepn16mgHcKM5OBJQ";

      // Cesium Viewer
      viewer = new Cesium.Viewer("cesiumContainer", {
        //terrainProvider: Cesium.createWorldTerrain(),
        terrainProvider: [],
        infoBox: false, //Disable InfoBox widget
        selectionIndicator: false, //Disable selection indicator
        navigationInstructionsInitiallyVisible: false,
      });

      // cleaning up the interface
      viewer.animation.container.style.visibility = "hidden";
      viewer.baseLayerPicker.container.style.visibility = "hidden";
      viewer.timeline.container.style.visibility = "hidden";
      viewer.bottomContainer.style.visibility = "hidden";
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
      viewer.forceResize();
      window.viewer = viewer;
      setInitialized(true);
    }

    //    const osmBuildings = viewer.scene.primitives.add(
    //      Cesium.createOsmBuildings()
    //    );
    for (let i = 0; i < entitiesArray.length; i++) drawEntity(i);
    return () => {
      window.location.reload();
    };
  }, [isLoaded]);

  const fetchData = async () => {
    // fetch position and orientation data from backend
    await fetch("http://localhost:5000/entities")
      .then((res) => res.json())
      .then((res) => {
        setEntities(res);
      });
    setLoaded(true);
  };

  const calculateTimeArray = (entity_index) => {
    var time_array = [];
    var entity_data = entitiesArray[entity_index].props;
    const timeStepInSeconds =
      (entity_data[1].timestamp - entity_data[0].timestamp) / 1e6;
    const startTime = new Cesium.JulianDate();
    for (let i = 0; i < entity_data.length; i++) {
      const time = Cesium.JulianDate.addSeconds(
        startTime,
        timeStepInSeconds * i,
        new Cesium.JulianDate()
      );
      time_array.push(time);
    }
    return time_array;
  };

  const calculatePostitionProperty = (
    time_array,
    entity_index,
    altitude_offset
  ) => {
    var property = new Cesium.SampledPositionProperty();
    if (!isLoaded) return; // return if the data is not loaded yet
    var position;
    var entity_data = entitiesArray[entity_index].props;

    for (var i = 0; i < entity_data.length; ++i) {
      var cur_pos = entity_data[i];
      const time = time_array[i];

      position = Cesium.Cartesian3.fromDegrees(
        cur_pos.longitude,
        cur_pos.lattitude,
        cur_pos.altitude + altitude_offset
      );
      property.addSample(time, position);
    }
    return property;
  };

  const calculateOrientationPropertyWithRollPitchYaw = (time_array, index) => {
    var entity_data = entitiesArray[index].props;
    var orientationProperty = new Cesium.SampledProperty(Cesium.Quaternion);

    for (var i = 0; i < entity_data.length; ++i) {
      var cur_pos = entity_data[i];
      const time = time_array[i];

      var position = Cesium.Cartesian3.fromDegrees(
        cur_pos.longitude,
        cur_pos.lattitude,
        cur_pos.altitude
      );

      var heading = Cesium.Math.toRadians(-90) + entity_data[i]["yaw"];
      var pitch = entity_data[i]["pitch"];
      var roll = entity_data[i]["roll"];

      var hpRoll = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      var orientation = Cesium.Transforms.headingPitchRollQuaternion(
        position,
        hpRoll
      );
      orientationProperty.addSample(time, orientation);
    }
    return orientationProperty;
  };

  const calculateOrientationPropertyWithQuaternions = (time_array, index) => {
    if (!isLoaded) return; // return if the data is not loaded yet

    /*
    var takeoff = await fetch("http://localhost:5000/takeoff_position")
      .then((res) => res.json())
      .then((res) => res[index].takeoff_position);
    */
    var takeoff = {
      alt: 270840,
      lat: 498044179,
      lon: 88782777,
      timestamp: 2360857556,
    };
    var takeoff_position = Cesium.Cartographic.fromDegrees(
      takeoff.lon * 1e-7,
      takeoff.lat * 1e-7
    );

    var entity_data = entitiesArray[index].props;
    var orientationProperty = new Cesium.TimeIntervalCollectionProperty();
    var origin = Cesium.Cartesian3.fromRadians(
      takeoff_position.longitude,
      takeoff_position.latitude
    );

    // assumes the position over the whole flight does not change too much
    // (we neglect the earth curvature)
    var transform_matrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
    // get 3x3 rot matrix
    var rotation_matrix = new Cesium.Matrix3();
    Cesium.Matrix4.getRotation(transform_matrix, rotation_matrix);
    // rotate by 90 deg to point towards north (instead of east)
    var m = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(90.0));
    rotation_matrix = Cesium.Matrix3.multiply(
      rotation_matrix,
      m,
      new Cesium.Matrix3()
    );
    // rotation quaterion from ENU to ECEF
    var q_enu_to_ecef = Cesium.Quaternion.fromRotationMatrix(rotation_matrix);

    for (let i = 0; i < entity_data.length - 1; i++) {
      var q = new Cesium.Quaternion(
        entity_data[i]["q1"],
        -entity_data[i]["q2"],
        -entity_data[i]["q3"],
        entity_data[i]["q0"]
      );
      var orientation_quaternion = new Cesium.Quaternion();
      Cesium.Quaternion.multiply(q_enu_to_ecef, q, orientation_quaternion);

      var timeInterval = new Cesium.TimeInterval({
        start: time_array[i],
        stop: time_array[i + 1],
        isStartIncluded: true,
        isStopIncluded: false,
        data: orientation_quaternion,
      });
      orientationProperty.intervals.addInterval(timeInterval);
    }
    return orientationProperty;
  };

  const drawEntity = async (index) => {
    if (!isLoaded) return; // return if the data is not loaded yet
    var entity = entitiesArray[index];
    var time_array = calculateTimeArray(0);
    var positionProperty = calculatePostitionProperty(time_array, index, 122);
    var orientationProperty = entity.useRPY
      ? calculateOrientationPropertyWithRollPitchYaw(time_array, index)
      : calculateOrientationPropertyWithQuaternions(time_array, index);
    //var orientationProperty = await calculateOrientationProperty(index);
    var startTime = time_array[0];
    var stopTime = time_array[time_array.length - 1];
    viewer.clock.startTime = startTime.clone();
    viewer.clock.stopTime = stopTime.clone();
    viewer.clock.currentTime = startTime.clone();
    viewer.timeline.zoomTo(startTime, stopTime);
    viewer.clock.multiplier = 1;
    viewer.clock.shouldAnimate = false;
    // 1340371
    const airplaneUri = await Cesium.IonResource.fromAssetId(1301486);
    const airplaneEntity = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({ start: startTime, stop: stopTime }),
      ]),
      position: positionProperty,
      orientation: orientationProperty,
      model: {
        uri: airplaneUri,
        color: Cesium.Color.WHITE.withAlpha(entitiesArray[index]["alpha"]),
      },
      path: {
        resolution: 1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          //color: Cesium.Color.fromRandom(),
          color: Cesium.Color.RED,
        }),
        width: 10,
      },
    });
    viewer.trackedEntity = airplaneEntity;
    window.time_array = time_array;
  };

  return (
    <>
      <div id="cesiumContainer"></div>
    </>
  );
}

export default Cesium;
