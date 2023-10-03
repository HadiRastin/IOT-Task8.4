const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomLatLong() {
  const latitude = Math.random() * 90;
  const longitude = Math.random() * 180;
  return { latitude, longitude };
}

function generateRandomDroneData(droneType) {
  const droneId = getRandomNumber(1, 100);
  const battery = getRandomNumber(0, 100);
  const altitude = Math.random() * 150;
  const speed = Math.random() * 100;
  const latLong = generateRandomLatLong();

  return {
    Id: droneId,
    Battery: battery,
    Altitude: altitude,
    Speed: speed,
    LatLong: latLong,
    Type: droneType,
  };
}

function publishDroneInfo(droneType) {
  const droneData = generateRandomDroneData(droneType);

  client.publish(
    `/drones/${droneType}/${droneData.Id}/altitude`,
    droneData.Altitude.toString()
  );

  client.publish(
    `/drones/${droneType}/${droneData.Id}/speed`,
    droneData.Speed.toString()
  );

  client.publish(
    `/drones/${droneType}/${droneData.Id}/latlong`,
    JSON.stringify(droneData.LatLong)
  );

  client.publish(
    `/drones/${droneType}/${droneData.Id}/battery`,
    droneData.Battery.toString()
  );

  console.log(`Published ${droneType} drone info for ID ${droneData.Id}`);
}

client.on("connect", function () {
  console.log("Connected to MQTT broker for publishing");

  setInterval(() => publishDroneInfo("LongDistanceDrone"), 5000);

  setInterval(() => publishDroneInfo("ShortDistanceDrone"), 5000);
});
