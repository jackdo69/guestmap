import React, {Component} from "react";
import Joi from "joi";
import "./App.css";
import L from "leaflet";
import {
  Card,
  Button,
  CardTitle,
  CardText,
  Form,
  FormGroup,
  Label,
  Input
} from "reactstrap";
import {Map, TileLayer, Marker, Popup} from "react-leaflet";
import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

var icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.6.0/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [22, 94],
  popupAnchor: [0, -41]
});

const schema = Joi.object().keys({
  name: Joi.string()
    .min(1)
    .max(500)
    .required(),
  message: Joi.string()
    .min(1)
    .max(500)
    .required()
});

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api/v1/messages"
    : "production-url";

class App extends Component {
  state = {
    location: {
      lat: 51.505,
      lng: -0.09
    },
    haveUsersLocation: false,
    zoom: 2,
    userMessage: {
      name: "",
      message: ""
    },
    sendingMessage: false,
    sentMessage: false,
    messages: []
  };

  componentDidMount() {
    fetch(API_URL)
      .then((res) => res.json())
      .then((messages) => {
        this.setState({
          messages
        });
      });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          haveUsersLocation: true,
          zoom: 13,
          userMessage: {
            name: "",
            message: ""
          }
        });
      },
      () => {
        console.log("Could not get the location from browser...");
        fetch(
          "http://api.ipstack.com/check?access_key=ef871a574011ccdce523555ec16042d5"
        )
          .then((res) => res.json())
          .then((location) => {
            console.log(location);

            this.setState({
              location: {
                lat: location.latitude,
                lng: location.longitude
              },
              haveUsersLocation: true,
              zoom: 13
            });
          });
      }
    );
  }

  formIsValid = () => {
    const userMessage = {
      name: this.state.userMessage.name,
      message: this.state.userMessage.message
    };
    const result = Joi.validate(userMessage, schema);
    return result.error ? false : true;
  };

  formSubmitted = (event) => {
    event.preventDefault();
    console.log(this.state.userMessage);

    if (this.formIsValid()) {
      this.setState({
        sendingMessage: true
      });
      fetch(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          ...this.state.userMessage,
          latitude: this.state.location.lat,
          longitude: this.state.location.lng
        })
      })
        .then((res) => res.json())
        .then((mess) => {
          console.log(mess);
          setTimeout(() => {
            this.setState({
              sendingMessage: false,
              sentMessage: true
            });
          }, 1000);
        });
    }
  };

  valueChanged = (event) => {
    const {name, value} = event.target;
    this.setState((prevState) => ({
      userMessage: {
        ...prevState.userMessage,
        [name]: value
      }
    }));
  };

  render() {
    const position = [this.state.location.lat, this.state.location.lng];
    return (
      <div>
        <Map className="map" center={position} zoom={this.state.zoom}>
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {this.state.haveUsersLocation ? (
            <Marker icon={icon} position={position}></Marker>
          ) : (
            ""
          )}
          {this.state.messages.map((mess) => (
            <Marker icon={icon} position={[mess.latitude, mess.longitude]}>
              <Popup>
                <em>{mess.name}</em>:{mess.message}
              </Popup>
            </Marker>
          ))}
        </Map>
        <Card body className="message-form">
          <CardTitle>Welcome to Guestmap!</CardTitle>
          <CardText>Leave a message with your location</CardText>
          {(!this.state.sendingMessage && !this.state.sentMessage) ||
          !this.state.haveUsersLocation ? (
            <Form onSubmit={this.formSubmitted}>
              <FormGroup>
                <Label for="Name">Name</Label>
                <Input
                  onChange={this.valueChanged}
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Your name...."
                />
              </FormGroup>
              <FormGroup>
                <Label for="Message">Message</Label>
                <Input
                  onChange={this.valueChanged}
                  type="text"
                  name="message"
                  id="message"
                  placeholder="Your message...."
                />
              </FormGroup>
              <Button disabled={!this.formIsValid()} color="info">
                Submit
              </Button>
            </Form>
          ) : this.state.sendingMessage || !this.state.haveUsersLocation ? (
            <Loader
              className="mx-auto"
              type="BallTriangle"
              color="#2d7cb1"
              height={80}
              width={80}
            />
          ) : (
            <CardTitle>Thanks for submitting a message!</CardTitle>
          )}
        </Card>
      </div>
    );
  }
}

export default App;
