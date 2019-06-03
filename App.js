import * as React from "react";
import {
  AppRegistry,
  Text,
  View,
  StyleSheet,
  Dimensions,
  Keyboard,
  Alert,
  TouchableOpacity
} from "react-native";
import {
  Constants,
  MapView,
  Permissions,
  Location,
  Font,
  AppLoading
} from "expo";

// or any pure javascript modules available in npm
import { Card } from "react-native-paper";
import { InputGroup, Input, Button, H3, Icon } from "native-base";

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

const GOOGLE_MAPS_APIKEY = "AIzaSyDx7Fu77vp5iLD9_Ki9BUEWsmMlBVF_3NQ";

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
      isListingSelected: false
    };
    this._results = null;
    this.mapView = null;
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
    this._getLocationAsync();
  }

  _getLocationAsync = async () => {
    // let { status } = await Permissions.askAsync(Permissions.LOCATION);
    // if (status !== "granted") {
    //   this.setState({
    //     locationResult: "Permission to access location was denied"
    //   });
    // }

    // let location = await Location.getCurrentPositionAsync({});
    // let region = {
    //   latitude: location.coords.latitude,
    //   longitude: location.coords.longitude,
    //   latitudeDelta: LATITUDE_DELTA,
    //   longitudeDelta: LONGITUDE_DELTA
    // };
    // //this.setState({ locationResult: JSON.stringify(location) });
    // this.onRegionChange(region, region.latitude, region.longitude);

    // console.log(JSON.stringify(location));
    this.watchID = navigator.geolocation.watchPosition(
      position => {
        // Create the object to update this.state.mapRegion through the onRegionChange function
        let region = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        };
        console.log("here");
        console.log("lat", position.coords.latitude);
        this.onRegionChange(region, region.latitude, region.longitude);
      },
      error => {
        this.setState({ error: error.message });
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 1
      }
    );
  };

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
    for (i = 0; i < list.length; i++) {
      if (list.hasOwnProperty(x) && list[i] === obj) {
        return true;
      }
    }

    return false;
  };

  onMapPress = e => {
    console.log(e.nativeEvent.coordinate);
    /*if (this.state.coordinates.length == 2) {
      this.setState({
        coordinates: [e.nativeEvent.coordinate],
      });
    } else {
      this.setState({
        coordinates: [...this.state.coordinates, e.nativeEvent.coordinate],
      });
    }*/
    if (
      this.containsObject(
        e.nativeEvent.coordinate,
        this.state.destCoordinates
      ) ||
      this.containsObject(e.nativeEvent.coordinate, this.state.coordinates)
    ) {
      return null;
    } else {
      this.setState({
        coordinates: [...this.state.coordinates, e.nativeEvent.coordinate]
      });
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
        <View style={styles.buttonContainer}>
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
        </View>
      </View>
    );
  }
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
  }
});

AppRegistry.registerComponent("App", () => App);
