// The main script for the extension
// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { executeSlashCommands, registerSlashCommand } from '../../../slash-commands.js';
import { generateRaw, getRequestHeaders, is_send_press, main_api, eventSource, event_types, saveSettings, saveChat, setSendButtonState } from '../../../../script.js';

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const extensionName = "st2rc";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};



// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  //Create the settings if they don't exist
  if (!extension_settings.st2rc) {
    extension_settings.st2rc= {
      isEnabled: true,
      port: "5003",
      api_type: "ooba"
    };
  }
  // Updating settings in the UI
  $("#example_setting").prop("checked", extension_settings[extensionName].example_setting).trigger("input");
}

const sendToCompletions = async(_, input) => {
  console.log("RC2ST - entering completions... ");
  input = input.replace("/rc_send ", "");
  let input_main = input;
  executeSlashCommands("/send "+input_main.replaceAll(new RegExp("```.*```", "g"), ""));
  executeSlashCommands("/echo sendinging to ReallmCraft...");
  setSendButtonState(true)
  let result = await fetch('http://localhost:'+extension_settings.st2rc.port.toString()+'/completions', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({ prompt: input, api_type: extension_settings.st2rc.api_type }),
  }).then(response => (response.json().then(data=> ({state: response.ok, data: data}))).then(data => { console.log(data); return data;}));

  console.log("RC2ST - Response: ",JSON.stringify(result));
  console.log("RC2ST - Response Code: ",result.state);

  console.log("RC2ST - DATA RETURNED: ", JSON.stringify(result.data));

  if (result.state === false) {
    try{
      console.log(JSON.stringify(result.data));
      executeSlashCommands("/echo "+result.data.response);
      return;
    } catch (e) {
      console.log("RC2ST Error: ", e);
      executeSlashCommands("/echo Unable to connect to ReallmCraft. Please check your settings and try again.");
      return;
    }

  }

  executeSlashCommands("/sendas name=\"Narrator\" "+result.data.response);
  setSendButtonState(false);

}

// This function is called when the extension settings are changed in the UI
function onExampleInput(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].example_setting = value;
  saveSettingsDebounced();
}

// This function is called when the button is clicked
function onButtonClick() {
  // You can do whatever you want here
  // Let's make a popup appear with the checked setting
  toastr.info(
      `The checkbox is ${extension_settings[extensionName].example_setting ? "checked" : "not checked"}`,
      "A popup appeared because you clicked the button!"
  );
}

// This function is called when the extension is loaded
jQuery(async () => {
  // This is an example of loading HTML from a file
  const settingsHtml =`
  <div class="example-extension-settings">
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>ReallmCraft Adapter</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <div class="example-extension_block flex-container">
                <input id="my_button" class="menu_button" type="submit" value="Example Button" />
            </div>

            <div class="example-extension_block flex-container">
                <input id="example_setting" type="checkbox" />
                <label for="example_setting">This is an example</label>
            </div>

            <hr class="sysHR" />
        </div>
    </div>
  </div>
  `;

  // Append settingsHtml to extensions_settings
  // extension_settings and extensions_settings2 are the left and right columns of the settings menu
  // Left should be extensions that deal with system functions and right should be visual/UI related
  $("#extensions_settings").append(settingsHtml);

  // These are examples of listening for events
  $("#my_button").on("click", onButtonClick);
  $("#example_setting").on("input", onExampleInput);

  // Load settings when starting things up (if you have any)
  loadSettings();

  registerSlashCommand("rc_send", sendToCompletions, ["rc_completions"], "Sends data in the input field to the completions endpoint.", true, true);
});
