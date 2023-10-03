const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

const LongDistanceDrone = {};
const ShortDistanceDrone = {};

function checkBatteryLevels(LongDistanceDrone, ShortDistanceDrone) {
  const lowBatteryDronesLongDistance = getLowBatteryDrones(LongDistanceDrone);
  const lowBatteryDronesShortDistance = getLowBatteryDrones(ShortDistanceDrone);

  if (lowBatteryDronesLongDistance.length > 2) {
    const alertMessage = generateLowBatteryAlert("LongDistanceDrone");
    console.log(alertMessage);
    client.publish("/alerts/lowBattery", alertMessage);
  }

  if (lowBatteryDronesShortDistance.length > 2) {
    const alertMessage = generateLowBatteryAlert("ShortDistanceDrone");
    console.log(alertMessage);
    client.publish("/alerts/lowBattery", alertMessage);
  }
}

function getLowBatteryDrones(Drone) {
  return Object.values(Drone).filter(
    (drone) =>
      drone.Battery.length > 0 &&
      drone.Battery[drone.Battery.length - 1].value < 10
  );
}

function generateLowBatteryAlert(droneType) {
  return `Alert: More than two ${droneType} drones have low battery levels`;
}

function checkStationaryDrones(Drone, type) {
  for (let id in Drone) {
    const drone = Drone[id];

    if (
      drone.Altitude.length > 0 &&
      drone.Altitude[drone.Altitude.length - 1].value > 100 &&
      Date.now() - drone.Altitude[drone.Altitude.length - 1].PublishTime >
        600000 &&
      drone.Longitude.length > 0 &&
      drone.Latitude.length > 0 &&
      drone.Longitude[drone.Longitude.length - 1].value ===
        drone.Longitude[drone.Altitude.length - 1].value &&
      drone.Latitude[drone.Latitude.length - 1].value ===
        drone.Latitude[drone.Altitude.length - 1].value
    ) {
      const alertMessage = `Alert: Drone ${type} with id of ${id} has been stationary above 100 altitude for more than 10 minutes.`;
      console.log(alertMessage);
      client.publish("/alerts/stationaryDrone", alertMessage);
    }
  }
}

client.on("connect", function () {
  console.log("Connected to MQTT broker for subscribing");

  client.subscribe("/drones/+/+/altitude");
  client.subscribe("/drones/+/+/speed");
  client.subscribe("/drones/+/+/latlong");
  client.subscribe("/drones/+/+/battery");

  setInterval(
    () => checkStationaryDrones(LongDistanceDrone, "LongDistanceDrone"),
    5000
  );
  setInterval(
    () => checkStationaryDrones(ShortDistanceDrone, "ShortDistanceDrone"),
    5000
  );

  setInterval(
    () => checkBatteryLevels(LongDistanceDrone, ShortDistanceDrone),
    5000
  );
});

client.on("message", function (topic, message) {
  const topicSplitted = topic.split("/");
  const droneType = topicSplitted[2];
  const attribute = topicSplitted[4];
  const droneId = topicSplitted[3];

  const value = JSON.parse(message);

  if (droneType === "LongDistanceDrone" && !LongDistanceDrone[droneId]) {
    LongDistanceDrone[droneId] = {
      Battery: [],
      Altitude: [],
      Latitude: [],
      Longitude: [],
      Speed: [],
    };
  } else if (
    droneType === "ShortDistanceDrone" &&
    !ShortDistanceDrone[droneId]
  ) {
    ShortDistanceDrone[droneId] = {
      Battery: [],
      Altitude: [],
      Latitude: [],
      Longitude: [],
      Speed: [],
    };
  }

  if (droneType === "LongDistanceDrone") {
    if (attribute === "battery") {
      LongDistanceDrone[droneId].Battery.push({
        PublishTime: Date.now(),
        value: value,
      });
    } else if (attribute === "altitude") {
      LongDistanceDrone[droneId].Altitude.push({
        PublishTime: Date.now(),
        value: value,
      });
    } else if (attribute === "latlong") {
      LongDistanceDrone[droneId].Latitude.push({
        PublishTime: Date.now(),
        value: value.latitude,
      });
      LongDistanceDrone[droneId].Longitude.push({
        PublishTime: Date.now(),
        value: value.longitude,
      });
    } else if (attribute === "speed") {
      LongDistanceDrone[droneId].Speed.push({
        PublishTime: Date.now(),
        value: value,
      });
    }
  }

  if (droneType === "ShortDistanceDrone") {
    if (attribute === "Battery") {
      ShortDistanceDrone[droneId].Battery.push({
        PublishTime: Date.now(),
        value: value,
      });
    } else if (attribute === "Altitude") {
      ShortDistanceDrone[droneId].Altitude.push({
        PublishTime: Date.now(),
        value: value,
      });
    } else if (attribute === "latlong") {
      ShortDistanceDrone[droneId].Latitude.push({
        PublishTime: Date.now(),
        value: value.latitude,
      });
      ShortDistanceDrone[droneId].Longitude.push({
        PublishTime: Date.now(),
        value: value.longitude,
      });
    } else if (attribute === "Speed") {
      ShortDistanceDrone[droneId].Speed.push({
        PublishTime: Date.now(),
        value: value,
      });
    }
  }

  console.log(
    `Received and stored data for ${droneType} drone ID ${droneId}, attribute ${attribute}`
  );
});
