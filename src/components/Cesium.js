import { Component } from "react";
class CesiumComponent extends Component {
  async componentDidMount() {
    var data, oData;
    await fetch("http://localhost:5000/position")
      .then((res) => res.json())
      .then((res) => {
        data = res.data;
      });
    await fetch("http://localhost:5000/orientation")
      .then((res) => res.json())
      .then((res) => {
        oData = res.data;
        window.orientation = res.data;
      });

    var Cesium = window.Cesium;
    var viewer = window.viewer;
    Cesium.Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiY2JkNjc2MS0yMWQwLTQ3MDMtOTg1NS0yZTBiZTgyNTI4YzgiLCJpZCI6MTA3MTk5LCJpYXQiOjE2NjI0NjUzMjh9.fQ0ozGXNo7UtrbFUFqQ6GXKfPJDepn16mgHcKM5OBJQ";

    viewer = new Cesium.Viewer("cesiumContainer", {
      //terrainProvider: Cesium.createWorldTerrain(),
      terrainProvider: [],
      infoBox: false, //Disable InfoBox widget
      selectionIndicator: false, //Disable selection indicator
      navigationInstructionsInitiallyVisible: false,
    });
    viewer.animation.container.style.visibility = "hidden";
    viewer.baseLayerPicker.container.style.visibility = "hidden";
    viewer.timeline.container.style.visibility = "hidden";
    viewer.bottomContainer.style.visibility = "hidden";
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end

    viewer.forceResize();

    // // const osmBuildings = viewer.scene.primitives.add(Cesium.createOsmBuildings());

    var takeoff_position = {
      longitude: 0.15495517777138937,
      latitude: 0.8692510743941999,
      height: 0,
    };
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

    const timeStepInSeconds = (data[2].timestamp - data[1].timestamp) / 1e6;
    const totalSeconds = timeStepInSeconds * (data.length - 1);
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
    viewer.clock.multiplier = 1;
    viewer.clock.shouldAnimate = false;
    const positionProperty = new Cesium.SampledPositionProperty();

    for (let i = 0; i < data.length - 1; i++) {
      const dataPoint = data[i];
      const dataOrientation = oData[i];
      const time = Cesium.JulianDate.addSeconds(
        startTime,
        i * timeStepInSeconds,
        new Cesium.JulianDate()
      );
      const time_next = Cesium.JulianDate.addSeconds(
        startTime,
        (i + 1) * timeStepInSeconds,
        new Cesium.JulianDate()
      );
      const position = Cesium.Cartesian3.fromDegrees(
        dataPoint.lon,
        dataPoint.lat,
        dataPoint.alt + 100
      );
      positionProperty.addSample(time, position);

      var q = new Cesium.Quaternion(
        dataOrientation["q[1]"],
        -dataOrientation["q[2]"],
        -dataOrientation["q[3]"],
        dataOrientation["q[0]"]
      );
      var orientation = new Cesium.Quaternion();
      Cesium.Quaternion.multiply(q_enu_to_ecef, q, orientation);

      var timeInterval = new Cesium.TimeInterval({
        start: time,
        stop: time_next,
        isStartIncluded: true,
        isStopIncluded: false,
        data: orientation,
      });
      orientationProperty.intervals.addInterval(timeInterval);
    }

    const airplaneUri = await Cesium.IonResource.fromAssetId(1301486);
    const airplaneEntity = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({ start: startTime, stop: stopTime }),
      ]),
      position: positionProperty,
      orientation: orientationProperty,

      // Attach the 3D model instead of the green point.
      model: { uri: airplaneUri },
      path: {
        resolution: 1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.1,
          color: Cesium.Color.PURPLE,
        }),
        width: 10,
      },
    });

    viewer.trackedEntity = airplaneEntity;

    // exporting variables to the window
    window.startTime = startTime;
    window.stopTime = stopTime;
    window.totalSeconds = totalSeconds;
    window.viewer = viewer;
    window.airplaneEntity = airplaneEntity;
  }

  render() {
    return (
      <>
        <div id="cesiumContainer"></div>
      </>
    );
  }
}

export default CesiumComponent;
