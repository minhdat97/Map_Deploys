import * as React from "react";
import {
  AppRegistry,
  Text,
  View,
  StyleSheet,
  Dimensions,
  Keyboard,
  Alert,
  TouchableOpacity,
  AlertIOS,
  Platform,
  AlertAndroid
} from "react-native";
import {
  Constants,
  MapView,
  Permissions,
  Location,
  Font,
  AppLoading,
  Marker
} from "expo";

// or any pure javascript modules available in npm
import { Card } from "react-native-paper";
import { InputGroup, Input, Button, H3, Icon } from "native-base";
const Scaledrone = require("scaledrone-react-native");
const SCALEDRONE_CHANNEL_ID = require("./scaledrone_channel_id.json");

// You can import from local files
import apis from "./components/Constant/api";
import _styles from "./components/SearchBoxStyles.js";
import MapViewDirections from "./components/MapViewDirections";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE = 10.766080148731438;
const LONGITUDE = 106.65898310270131;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const GOOGLE_MAPS_APIKEY = "AIzaSyDCLvmZ_auB3d8yaIkHHZMu83Jta4Vir8w";

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mapRegion: null,
      //lastLat: null,
      //lastLong: null,
      curCoordinates: [
        {
          latitude: null,
          longitude: null
        }
      ],

      coordinates: [
        /*{
          latitude: 10.7903633,
          longitude: 106.76994499999999,
        },*/
      ],
      destCoordinates: [
        {
          lat: null,
          lng: null
        }
      ],
      value: null,
      temp_value: null,
      fontLoaded: false,
      isListingSelected: false,
      members: []
    };
    this._results = null;
    this.mapView = null;
    this._clientID = null;
    this.arrayMarker = [];
  }

  async componentWillMount() {
    try {
      await Font.loadAsync({
        Roboto: require("native-base/Fonts/Roboto.ttf"),
        Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
        Ionicons: require("native-base/Fonts/Ionicons.ttf")
      });
      this.setState({ fontLoaded: true });
    } catch (error) {
      console.log("error loading icon fonts", error);
    }
  }

  componentDidMount() {
    /*this._mounted = true;

    this.watchID = navigator.geolocation.watchPosition(
      position => {
        // Create the object to update this.state.mapRegion through the onRegionChange function
        let region = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        console.log('here');
        console.log('lat', position.coords.latitude);
        this.onRegionChange(region, region.latitude, region.longitude);
      },
      error => {
        this.setState({ error: error.message });
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
      }
    );*/
    //this._getLocationAsync();
    this._getLocationFriendAsync();
  }

  _getLocationFriendAsync = async () => {
    const drone = new Scaledrone(SCALEDRONE_CHANNEL_ID);
    drone.on("error", error => console.error(error));
    drone.on("close", reason => console.error(reason));
    drone.on("open", error => {
      if (error) {
        return console.error(error);
      }
      if (Platform.OS === "ios") {
        // AlertIOS.prompt("Please insert your name", null, name =>
        //   doAuthRequest(drone.clientId, name).then(jwt =>
        //     drone.authenticate(jwt)
        //   )
        // );
        doAuthRequest(drone.clientId, "Đạt").then(jwt =>
          drone.authenticate(jwt)
        );
      } else {
        AlertAndroid.prompt("Please insert your name", null, name =>
          doAuthRequest(drone.clientId, name).then(jwt =>
            drone.authenticate(jwt)
          )
        );
      }
      this._clientID = drone.clientId;

      //doAuthRequest(drone.clientId, "Tôi").then(jwt => drone.authenticate(jwt));
    });
    const room = drone.subscribe("observable-locations", {
      historyCount: 50 // load 50 past messages
    });
    room.on("open", error => {
      if (error) {
        return console.error(error);
      }
      this.startLocationTracking(position => {
        const { latitude, longitude } = position.coords;
        let region = {
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        };
        this.onRegionChange(region, region.latitude, region.longitude);
        // publish device's new location
        drone.publish({
          room: "observable-locations",
          message: { latitude, longitude }
        });
      });
    });
    // received past message
    room.on("history_message", message =>
      this.updateLocation(message.data, message.clientId)
    );
    // received new message
    room.on("data", (data, member) => this.updateLocation(data, member.id));
    // array of all connected members
    room.on("members", members => this.setState({ members }));
    // new member joined room
    room.on("member_join", member => {
      const members = this.state.members.slice(0);
      members.push(member);
      this.setState({ members });
    });
    // member left room
    room.on("member_leave", member => {
      const members = this.state.members.slice(0);
      const index = members.findIndex(m => m.id === member.id);
      if (index !== -1) {
        members.splice(index, 1);
        this.setState({ members });
      }
    });
  };

  startLocationTracking(callback) {
    navigator.geolocation.watchPosition(callback, error => console.log(error), {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 1000,
      distanceFilter: 1
    });
  }

  updateLocation(data, memberId) {
    const { members } = this.state;
    const member = members.find(m => m.id === memberId);
    if (!member) {
      // a history message might be sent from a user who is no longer online
      return;
    }
    if (member.location) {
      member.location
        .timing({
          latitude: data.latitude,
          longitude: data.longitude
        })
        .start();
    } else {
      member.location = new MapView.AnimatedRegion({
        latitude: data.latitude,
        longitude: data.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      });
      this.forceUpdate();
    }
  }

  // _getLocationAsync = async () => {
  //   // let { status } = await Permissions.askAsync(Permissions.LOCATION);
  //   // if (status !== "granted") {
  //   //   this.setState({
  //   //     locationResult: "Permission to access location was denied"
  //   //   });
  //   // }

  //   // let location = await Location.getCurrentPositionAsync({});
  //   // let region = {
  //   //   latitude: location.coords.latitude,
  //   //   longitude: location.coords.longitude,
  //   //   latitudeDelta: LATITUDE_DELTA,
  //   //   longitudeDelta: LONGITUDE_DELTA
  //   // };
  //   // //this.setState({ locationResult: JSON.stringify(location) });
  //   // this.onRegionChange(region, region.latitude, region.longitude);

  //   // console.log(JSON.stringify(location));
  //   this.watchID = navigator.geolocation.watchPosition(
  //     position => {
  //       // Create the object to update this.state.mapRegion through the onRegionChange function
  //       let region = {
  //         latitude: position.coords.latitude,
  //         longitude: position.coords.longitude,
  //         latitudeDelta: LATITUDE_DELTA,
  //         longitudeDelta: LONGITUDE_DELTA
  //       };
  //       console.log("here");
  //       console.log("lat", position.coords.latitude);
  //       this.onRegionChange(region, region.latitude, region.longitude);
  //     },
  //     error => {
  //       this.setState({ error: error.message });
  //     },
  //     {
  //       enableHighAccuracy: true,
  //       distanceFilter: 1
  //     }
  //   );
  // };

  onRegionChange(region, lastLat, lastLong) {
    this.setState({
      mapRegion: region,
      curCoordinates: { latitude: lastLat, longitude: lastLong } || {
        latitude: this.state.curCoordinates.latitude,
        longitude: this.state.curCoordinates.longitude
      }
      // If there are no new values set use the the current ones
      //lastLat: lastLat || this.state.lastLat,
      //lastLong: lastLong || this.state.lastLong,
    });
    this.arrayMarker.push(this.state.curCoordinates);
    console.log(this.state.mapRegion);
  }

  geoAddress = value => {
    try {
      fetch(apis.findLatLngFromPlace.replace("{{address}}", value))
        .then(response => response.json())
        .then(responseJson => {
          if (responseJson.status !== "OK") {
            const errorMessage = responseJson.error_message || "Unknown error";
            return console.log(errorMessage);
          }

          if (responseJson.results) {
            this._results = responseJson.results[0];

            console.log(this._results);

            this.setState({
              destCoordinates: this._results.geometry.location
            });
            this.arrayMarker.push(this.state.destCoordinates);
            console.log("destCoordinates", this.state.destCoordinates);
          } else {
            return console.log("error");
          }
        });
    } catch (err) {
      console.log(err);
    }
  };

  myFunc = () => {
    const { value } = this.state;

    this.state.coordinates = [];

    console.log(value);
    //this.geoAddress(origin);
    Keyboard.dismiss();
    this.temp_value = value;
    this.geoAddress(value);
    //this.directionResult();
    //this.debugFunc()
    //console.log("abc here")
  };

  containsObject = (obj, list) => {
    let i;
    let found = list.find(
      el =>
        (el.lat === obj.latitude && el.lng === obj.longitude) ||
        (el.latitude === obj.latitude && el.longitude === obj.longitude)
    );
    if (!!found) return true;
    else return false;
  };

  onMapPress = e => {
    console.log("e.nativeEvent.coordinate", e.nativeEvent.coordinate);
    console.log("this.arrayMarker", this.arrayMarker);
    console.log(
      this.containsObject(e.nativeEvent.coordinate, this.arrayMarker)
    );
    /*if (this.state.coordinates.length == 2) {
      this.setState({
        coordinates: [e.nativeEvent.coordinate],
      });
    } else {
      this.setState({
        coordinates: [...this.state.coordinates, e.nativeEvent.coordinate],
      });
    }*/
    if (this.containsObject(e.nativeEvent.coordinate, this.arrayMarker)) {
      return null;
    } else {
      this.setState({
        coordinates: [...this.state.coordinates, e.nativeEvent.coordinate]
      });
      this.arrayMarker.push(this.state.coordinates);
    }

    console.log(this.state.coordinates);
  };

  onReady = result => {
    console.log(`Distance: ${result.distance} km`);
    console.log(`Duration: ${result.duration} min.`);

    this.mapView.fitToCoordinates(result.coordinates, {
      edgePadding: {
        right: width / 20,
        bottom: height / 20,
        left: width / 20,
        top: height / 5
      }
    });
  };

  onError = errorMessage => {
    Alert.alert(errorMessage);
  };

  render() {
    if (!this.state.fontLoaded) {
      return <AppLoading />;
    }
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={this.state.mapRegion}
          ref={c => (this.mapView = c)} // eslint-disable-line react/jsx-no-bind
          loadingEnabled={true}
          showsUserLocation={true}
          followUserLocation={true}
          //showsMyLocationButton={true}
          showsPointsOfInterest={true}
          onPress={this.onMapPress.bind(this)}
        >
          {this.createMarkers()}
          {!!this.state.destCoordinates.lat && (
            <MapView.Marker
              coordinate={{
                latitude: this.state.destCoordinates.lat,
                longitude: this.state.destCoordinates.lng
              }}
              title={`${this._results}`}
            />
          )}
          {this.state.coordinates.length >= 1 &&
            this.state.coordinates.map(
              (coordinate, index) => (
                <MapView.Marker
                  key={`coordinate_${index}`}
                  coordinate={coordinate}
                  title={`Your location_${index}`}
                  //onPress={this.showCallout()}
                />
              ) // eslint-disable-line react/no-array-index-key
            )}
          {!!this.state.destCoordinates.lat && (
            <MapViewDirections
              /*origin={this.state.coordinates[0]}
              destination={this.state.coordinates[1]}*/
              origin={this.state.curCoordinates}
              waypoints={
                this.state.coordinates.length >= 1
                  ? this.state.coordinates
                  : null
              }
              destination={`${this.state.destCoordinates.lat},${
                this.state.destCoordinates.lng
              }`}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={3}
              strokeColor="hotpink"
              optimizeWaypoints={true}
              onStart={params => {
                console.log(
                  `Started routing between "${params.origin}" and "${
                    params.destination
                  }"`
                );
              }}
              onReady={this.onReady}
              onError={this.onError}
            />
          )}
        </MapView>
        <View style={_styles.searchBox}>
          <View style={_styles.inputWrapper}>
            <InputGroup>
              <Icon name="search" style={{ fontSize: 20, color: "red" }} />
              <Input
                style={_styles.inputSearch}
                placeholder="Choose destination location"
                onChangeText={value => this.setState({ value })}
                //onSubmitEditing={Keyboard.dismiss}
                //value={this.state.value}
              />
              <Button
                block
                large
                style={_styles.buttonSearch}
                onPress={this.myFunc}
              >
                <H3>To</H3>
              </Button>
            </InputGroup>
          </View>
        </View>
        {/* <View style={styles.buttonContainer}>
          {!this.state.isListingSelected && (
            <TouchableOpacity
              style={styles.myLocationButton}
              onPress={() => {
                this._getLocationAsync();
              }}
            >
              <Icon name="md-navigate" size={24} />
            </TouchableOpacity>
          )}
        </View> */}
        <View pointerEvents="none" style={styles.members}>
          {this.createMembers()}
        </View>
        <View style={styles.buttonFitContainer}>
          <TouchableOpacity
            onPress={() => this.fitToMarkersToMap()}
            style={[styles.bubble, styles.button]}
          >
            <Text>Fit Markers Onto Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  createMarkers() {
    const { members } = this.state;

    const membersWithLocations = members.filter(m => !!m.location);
    return membersWithLocations.map(member => {
      const { id, location, authData } = member;
      const { name, color } = authData;

      return (
        <MapView.Marker.Animated
          key={id}
          identifier={id}
          coordinate={location}
          pinColor={color}
          title={name}
        />
      );
    });
  }

  createMembers() {
    const { members } = this.state;

    const memberMe = members.find(m => m.id === this._clientID);
    return members.map(member => {
      const { name, color } = member.authData;
      return (
        <View key={member.id} style={styles.member}>
          <View style={[styles.avatar, { backgroundColor: color }]} />
          {member.id === this._clientID ? (
            <Text style={styles.memberName}>Tôi</Text>
          ) : (
            <Text style={styles.memberName}>{name}</Text>
          )}
        </View>
      );
    });
  }

  fitToMarkersToMap() {
    const { members } = this.state;
    this.mapView.fitToSuppliedMarkers(members.map(m => m.id), true);
  }
}

function doAuthRequest(clientId, name) {
  let status;
  console.log("go here");
  return fetch("http://192.168.0.107:3000/auth", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ clientId, name })
  })
    .then(res => {
      status = res.status;
      console.log("res", res);
      return res.text();
    })
    .then(text => {
      if (status === 200) {
        return text;
      } else {
        alert(text);
      }
    })
    .catch(error => console.error(error));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#ecf0f1"
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  plainView: {
    width: 60
  },
  /*bubble: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 20
  },
  button: {
    width: 80,
    paddingHorizontal: 5,
    alignItems: "center",
    marginHorizontal: 5
  },
  buttonContainer: {
    flexDirection: "row",
    marginVertical: 5,
    backgroundColor: "transparent"
  }*/
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",

    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    //marginVertical: 5,
    backgroundColor: "#fff",
    borderRadius:
      Math.round(
        Dimensions.get("window").width + Dimensions.get("window").height
      ) / 2,
    width: Dimensions.get("window").width * 0.15,
    height: Dimensions.get("window").width * 0.15
  },
  myLocationButton: {
    position: "absolute",
    paddingBottom: 10,
    //display: "block",
    //bottom: 12,
    //right: 18,

    //backgroundColor: "#ecf0f1",
    //bottom: 4,
    //right: 4,
    //padding: 15,
    //elevation: 3,
    alignSelf: "flex-end"
  },
  bubble: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 20
  },
  latlng: {
    width: 200,
    alignItems: "stretch"
  },
  button: {
    paddingHorizontal: 12,
    alignItems: "center",
    marginHorizontal: 10
  },
  buttonFitContainer: {
    width: Dimensions.get("window").width,
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    marginVertical: 16,
    backgroundColor: "transparent"
  },
  members: {
    position: "absolute",
    bottom: 80,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: 10
  },
  member: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,1)",
    borderRadius: 20,
    height: 30,
    marginTop: 10
  },
  memberName: {
    marginHorizontal: 10
  },
  avatar: {
    height: 30,
    width: 30,
    borderRadius: 15
  }
});

AppRegistry.registerComponent("App", () => App);
