//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       SFDX-Falcon Utility Module
 * @description   Exports functions that provide common, helpful utility logic.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path            from  'path';                   // Module. Node's path library.
import {ConfigFile}         from  '@salesforce/core';       // Module. SFDX Core library.
// Import Local Modules
import {SfdxFalconDebug}    from  '../sfdx-falcon-debug';   // Class. Internal Debug module
// Require Modules
const uuid = require('uuid/v1');                            // Generates a timestamp-based UUID


// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:general:';
const clsDbgNs  = '';

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    createUniqueUsername
 * @param       {string}  baseUsername  The starting point for the username.  It should already be
 *                                      in the form of an email, eg 'name@domain.org'.
 * @returns     {string}  Returns the baseUsername with a pseudo-uuid appended to the end.
 * @description Given a base username to start with (eg. 'name@domain.org'), returns what should be
 *              a globally unique username with a pseudo-uuid appended the end of the username base.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function createUniqueUsername(baseUsername:string):string {
  let usernameMaxLength = 35;
  if (typeof baseUsername === 'undefined') throw new Error(`ERROR_INVALID_ARGUMENT: Expected a value for baseUsername but got undefined`);
  if (baseUsername.length > usernameMaxLength) throw new Error(`ERROR_USERNAME_LENGTH: Username can not be longer than ${usernameMaxLength} chars to keep room for appending a UUID`);
  return baseUsername + uuid();
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    readConfigFile
 * @param       {string}  rootFolder  Required. The root folder where the config file is stored.
 * @param       {string}  filename    Required. The name of the config file.
 * @returns     {Promise<any>}    Resolves by returning the config file contents as a JS Object.
 * @description Given a path and filename, attempts to load the contents of the config file and 
 *              convert them into a JavaScript Object.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function readConfigFile(rootFolder:string, filename:string):Promise<any> {
  // Combine rootFolder and filename to get a complete path
  let filePath = path.join(rootFolder, filename);

  // Get the DemoConfigJson file that (should be) referenced in project config.
  let configFileOptions = {
    rootFolder: rootFolder,
    filename:   filename,
    isGlobal:   false,
    isState:    false,
  }
  SfdxFalconDebug.obj(`${dbgNs}readConfigFile`, configFileOptions, `${clsDbgNs}configFileOptions: `);

  // Retrieve the config file specified by the Config File Options.
  let configFile = await ConfigFile.retrieve(configFileOptions);

  // Verify that the file exists before trying to parse it.
  if (await configFile.exists() === false) {
    throw new Error(`ERROR_CONFIG_NOT_FOUND: File does not exist - ${filePath}`);
  }
  SfdxFalconDebug.obj(`${dbgNs}readConfigFile`, configFile, `${clsDbgNs}configFile: `);

  // Parse the Demo Build Config File to get a Demo Build Sequence object.
  return configFile.toObject();
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    safeParse
 * @param       {any} contentToParse  Required. The content to be parsed.
 *                                      that will be parsed to create an SFDX Command String.
 * @returns     {object}  A JavaScript object based on the content to parse.
 * @description Given any content to parse, returns a JavaScript object based on that content. If
 *              the content is not parseable, it is returned as an object with one key: unparsed.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function safeParse(contentToParse:any):object {
  SfdxFalconDebug.obj(`${dbgNs}safeParse`, contentToParse, `${clsDbgNs}contentToParse: `);
  try {
    return JSON.parse(contentToParse);
  } catch(e) {
    return {unparsed: `${contentToParse}`}
  }
}