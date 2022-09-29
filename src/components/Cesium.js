import { useState, useEffect } from "react";
import Controls from "./Controls";
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
        terrainProvider: Cesium.createWorldTerrain(),
        //terrainProvider: [],
        infoBox: false, //Disable InfoBox widget
        selectionIndicator: false, //Disable selection indicator
        navigationInstructionsInitiallyVisible: false,
      });
      setInitialized(true);
    }

    // cleaning up the interface
    viewer.animation.container.style.visibility = "hidden";
    viewer.baseLayerPicker.container.style.visibility = "hidden";
    viewer.timeline.container.style.visibility = "hidden";
    viewer.bottomContainer.style.visibility = "hidden";
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
    viewer.forceResize();
    for (let i = 0; i < entitiesArray.length; i++) drawEntity(i);
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

  const calculatePostitionProperty = (entity_index, altitude_offset) => {
    var property = new Cesium.SampledPositionProperty();
    //if (!positionArray[0]) return; // return if the data is not loaded yet
    if (!isLoaded) return; // return if the data is not loaded yet
    var position;
    var entity_data = entitiesArray[entity_index].props;

    // TODO : check if totalSeconds is huge show perfermance warning
    // TODO : remove repetitive stopTime calculations
    // time stuff
    const timeStepInSeconds =
      (entity_data[1].timestamp - entity_data[0].timestamp) / 1e6;

    const totalSeconds = timeStepInSeconds * (entity_data.length - 1);
    const startTime = Cesium.JulianDate.fromIso8601("0000-00-00");
    startTime.dayNumber = 0;
    startTime.secondsOfDay = 0;
    const stopTime = Cesium.JulianDate.addSeconds(
      startTime,
      totalSeconds,
      new Cesium.JulianDate()
    );

    for (var i = 0; i < entity_data.length; ++i) {
      var cur_pos = entity_data[i];
      const time = Cesium.JulianDate.addSeconds(
        startTime,
        timeStepInSeconds * i,
        new Cesium.JulianDate()
      );

      position = Cesium.Cartesian3.fromDegrees(
        cur_pos.longitude,
        cur_pos.lattitude,
        cur_pos.altitude + altitude_offset
      );
      property.addSample(time, position);
    }
    window.startTime = startTime;
    window.stopTime = stopTime;
    window.totalSeconds = totalSeconds;
    return property;
  };

  const calculateOrientationPropertyWithRollPitchYaw = (index) => {};

  const calculateOrientationProperty = async (index) => {
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

    // time stuff
    const timeStepInSeconds =
      (entity_data[1].timestamp - entity_data[0].timestamp) / 1e6;
    const totalSeconds = timeStepInSeconds * (entity_data.length - 1);
    const startTime = Cesium.JulianDate.fromIso8601("0000-00-00");
    startTime.dayNumber = 0;
    startTime.secondsOfDay = 0;
    const stopTime = Cesium.JulianDate.addSeconds(
      startTime,
      totalSeconds,
      new Cesium.JulianDate()
    );

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
      const time = Cesium.JulianDate.addSeconds(
        startTime,
        timeStepInSeconds * i,
        new Cesium.JulianDate()
      );

      const time_next = Cesium.JulianDate.addSeconds(
        startTime,
        timeStepInSeconds * (i + 1),
        new Cesium.JulianDate()
      );

      var q = new Cesium.Quaternion(
        entity_data[i]["q1"],
        -entity_data[i]["q2"],
        -entity_data[i]["q3"],
        entity_data[i]["q0"]
      );
      var orientation_quaternion = new Cesium.Quaternion();
      Cesium.Quaternion.multiply(q_enu_to_ecef, q, orientation_quaternion);

      var timeInterval = new Cesium.TimeInterval({
        start: time,
        stop: time_next,
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
    var entity_data = entitiesArray[index].props;

    var positionProperty = calculatePostitionProperty(index, 122);
    var orientationProperty =
      calculateOrientationPropertyWithRollPitchYaw(index);
    console.log(orientationProperty);
    //var orientationProperty = await calculateOrientationProperty(index);

    const timeStepInSeconds =
      (entity_data[1].timestamp - entity_data[0].timestamp) / 1e6;
    const totalSeconds = timeStepInSeconds * (entity_data.length - 1);
    var startTime = Cesium.JulianDate.fromIso8601("0000-00-00");
    startTime.dayNumber = 0;
    startTime.secondsOfDay = 0;
    const stopTime = Cesium.JulianDate.addSeconds(
      startTime,
      totalSeconds,
      new Cesium.JulianDate()
    );

    viewer.clock.startTime = startTime.clone();
    viewer.clock.stopTime = stopTime.clone();
    viewer.clock.currentTime = startTime.clone();
    viewer.timeline.zoomTo(startTime, stopTime);
    viewer.clock.multiplier = 0.5;
    viewer.clock.shouldAnimate = false;
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
          glowPower: 0.1,
          color: Cesium.Color.fromRandom(),
        }),
        width: 10,
      },
    });
    viewer.trackedEntity = airplaneEntity;
    window.viewer = viewer;
  };

  return (
    <>
      <div id="cesiumContainer"></div>
    </>
  );
}

export default Cesium;
