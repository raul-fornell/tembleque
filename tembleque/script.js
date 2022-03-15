import { 
  setupApp, 
  defineBindableProperty,
  setValueToProperty, 
  watchPropertyChange 
} from "./lib/tembleque.js";

const app = {
  changeValue(newValue) {
    setValueToProperty("value", newValue);
  },
  changeOptions(option) {
    setValueToProperty("options", option);
  }
}
setupApp("#app", app);
defineBindableProperty("value", "Hello world");
watchPropertyChange("value", data => {
  console.log("Property has changed", data);
});

defineBindableProperty("radio", "two");