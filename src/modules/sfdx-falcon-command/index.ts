//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-command/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports SfdxFalconCommand for use with creating custom Salesforce CLI commands.
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path                      from  'path';                       // Helps resolve local paths at runtime.
import {flags}                        from  '@oclif/command';             // Requried to create CLI command flags.
import {SfdxCommand}                  from  '@salesforce/command';        // Required by child classe to create a CLI command
import {Messages}                     from  '@salesforce/core';           // Messages library that simplifies using external JSON for string reuse.

// Import Internal Modules
import {SfdxFalconDebug}              from  '../sfdx-falcon-debug';             // Internal debugging framework for SFDX-Falcon.
import {SfdxFalconError}              from  '../sfdx-falcon-error';             // Why?
import {SfdxFalconResult}             from  '../sfdx-falcon-result';            // Why?
import {SfdxFalconResultType}         from  '../sfdx-falcon-result';            // Why?
import {SfdxFalconJsonResponse}       from  '../sfdx-falcon-types';             // Why?
import {validateLocalPath}            from  '../sfdx-falcon-validators';        // Core validation function to check that local path values don't have invalid chars.

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @enum        SfdxFalconCommandType
 * @description Defines the possible types of SFDX-Falcon Commands.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export enum SfdxFalconCommandType {
  APPX_PACKAGE    = 'APPX_PACKAGE',
  APPX_DEMO       = 'APPX_DEMO',
  APPX_EXTENSION  = 'APPX_EXTENSION',
  UNKNOWN         = 'UNKNOWN'
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxFalconCommandResultDetail
 * @description Model of the Detail object that should be attached to an SFDX-Falcon COMMAND Result.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconCommandResultDetail {
  commandName:      string;
  commandType:      SfdxFalconCommandType;
  commandFlags:     any;
  commandArgs:      any;
  commandExitCode:  number;
  enabledDebuggers: string[];
}

//─────────────────────────────────────────────────────────────────────────────┐
// SFDX Core library has the ability to import a JSON file with message strings
// making it easy to separate logic from static output messages. There are 
// two steps required to use this.
//
// Step 1:  Tell the Messages framework to look for and import a 'messages' 
//          directory from inside the root of your project.
// Step 2:  Create a Messages object representing a message bundle from inside
//          your 'messages' directory.  The second param represents the name of
//          the JSON file you're trying to load. 
// 
// Note that messages from @salesforce/command, @salesforce/core, or any library
// that is using the messages framework can also be loaded this way by 
// specifying the module name as the first parameter of loadMessages().
//─────────────────────────────────────────────────────────────────────────────┘
Messages.importMessagesDirectory(__dirname);
const baseMessages  = Messages.loadMessages('sfdx-falcon', 'sfdxFalconCommand');
const errorMessages = Messages.loadMessages('sfdx-falcon', 'sfdxFalconError');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @abstract
 * @class       SfdxFalconCommand
 * @extends     SfdxCommand
 * @summary     Abstract base class class for building Salesforce CLI commands that use Yeoman.
 * @description Classes that extend SfdxYeomanCommand will be able to run any Generator defined
 *              in the src/generators directory.  The file name in src/generators should match the 
 *              generatorType string passed into runYeomanGenerator().  For example, if 
 *              generatorType==="my-generator", then there MUST be a TS script file located at 
 *              src/generators/my-generator.ts.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class SfdxFalconCommand extends SfdxCommand {

  // These help build and deliver a JSON response once command execution is done.
  protected falconCommandName:          string;                         // Why?
  protected falconCommandResult:        SfdxFalconResult;               // Why?
  protected falconCommandResultDetail:  SfdxFalconCommandResultDetail;  // Why?
  protected falconJsonResponse:         SfdxFalconJsonResponse;         // Why?

  // Member vars for commonly implemented flags.
  protected outputDirectory:            string;                         // Why?
  protected projectDirectory:           string;                         // Why?
  protected targetDirectory:            string;                         // Why?
  protected recipeFile:                 string;                         // Why?
  protected configFile:                 string;                         // Why?
  protected extendedOptions:            {any}                           // Why?

  // Member vars for commonly implemented arguments.
  protected gitRemoteUri:               string;                         // Why?
  protected gitCloneDirectory:          string;                         // Why?

  // Member vars for ALL debug flags
  protected falconDebugFlag:            Array<string> = new Array<string>();  // Why?
  protected falconDebugErrorFlag:       boolean       = false;                // Why?
  protected falconDebugSuccessFlag:     boolean       = false;                // Why?
  protected falconDebugDepthFlag:       number        = 2;                    // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the baseline set of custom FLAGS used by all SFDX-Falcon commands.
  //    --FALCONDEBUG           Command should run in DEBUG mode.
  //    --FALCONDEBUGERROR      Command should run in ERROR DEBUG mode.
  //    --FALCONDEBUGSUCCESS    Command should run in SUCCESS DEBUG mode.
  //    --FALCONDEBUGDEPTH      Object inspection depth when debug is rendered.
  //───────────────────────────────────────────────────────────────────────────┘
  public static falconBaseflagsConfig = {
    falcondebug: {
      description: baseMessages.getMessage('falcondebug_FlagDescription'),
      required: false,
      hidden: false,
      type: 'array',
      default: ''
    },
    falcondebugerror: flags.boolean({
      description: baseMessages.getMessage('falcondebugerror_FlagDescription'),
      required: false,
      hidden: false
    }),
    falcondebugsuccess: flags.boolean({
      description: baseMessages.getMessage('falcondebugsuccess_FlagDescription'),  
      required: false,
      hidden: false
    }),
    falcondebugdepth: {
      description: baseMessages.getMessage('falcondebugdepth_FlagDescription'),
      required: false,
      hidden: false,
      type: 'number',
      default: 2
    }
  };

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    sfdxFalconCommandInit
   * @param       {string}  commandName Required. ???
   * @param       {SfdxFalconCommandType} commandType Required. ???
   * @returns     {void}
   * @description Initializes various SfdxFalconCommand structures.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected sfdxFalconCommandInit(commandName:string='UNSPECIFIED_FALCON_COMMAND', commandType:SfdxFalconCommandType) {

    // Initialize the JSON response
    this.falconJsonResponse = {
      falconStatus: 0,
      falconResult: 'RESPONSE_NOT_SPECIFIED'
    };
  
    // Set the command name
    this.falconCommandName = commandName;

    // Read the inocming values for all COMMON FLAGS. (not all of these will have values)
    this.outputDirectory            = path.resolve(this.flags.outputdir       ||  '.');
    this.projectDirectory           = path.resolve(this.flags.projectdir      ||  '.');
    this.targetDirectory            = path.resolve(this.flags.targetdir       ||  '.');
    this.recipeFile                 = path.resolve(this.flags.recipefile      ||  '.');
    this.configFile                 = path.resolve(this.flags.configfile      ||  '.');
    this.extendedOptions            = JSON.parse((this.flags.extendedOptions  ||  '{}'));
  
    // Read the incoming values for all COMMON ARGS. (not all of these will have values)
    this.gitRemoteUri               = this.args.GIT_REMOTE_URI        ||  '';
    this.gitCloneDirectory          = this.args.GIT_CLONE_DIR         ||  '';

    // Read the incoming values for all DEBUG flags.
    this.falconDebugFlag            = this.flags.falcondebug          ||  '';
    this.falconDebugErrorFlag       = this.flags.falcondebugerror     ||  false;
    this.falconDebugSuccessFlag     = this.flags.falcondebugsuccess   ||  false;
    this.falconDebugDepthFlag       = this.flags.falcondebugdepth     ||  2;

    // Parse the list of Debug Namespaces to build an array of namespaces to enable.
    if (this.flags.falcondebug) {
      this.falconDebugFlag = this.flags.falcondebug.split(',');
    }
    else {
      this.falconDebugFlag = [];
    }

    // Specify the top-level SFDX-Falcon debugger namespaces to enable.
    let enabledDebuggers = new Array<string>();

    // Build an array of the debugger namespaces to enable.
    for (let debugNamespace of this.falconDebugFlag) {
      enabledDebuggers.push(`${debugNamespace.trim()}`);
    }
    if (this.falconDebugErrorFlag)    enabledDebuggers.push('FALCON_ERROR');
    if (this.falconDebugSuccessFlag)  enabledDebuggers.push('FALCON_SUCCESS');

    // Initialize the DETAIL object for the COMMAND Result.
    this.falconCommandResult = 
      new SfdxFalconResult(commandName, SfdxFalconResultType.COMMAND,
                          { startNow:       true,
                            bubbleError:    false,    // Let onError() handle errors (no bubbling)
                            bubbleFailure:  false});  // Let onSuccess() handle failures (no bubbling)

    // Setup the shell of the DETAIL for the RECIPE Result.
    this.falconCommandResultDetail = {commandName:      commandName,
                                      commandType:      commandType,
                                      commandFlags:     this.flags,
                                      commandArgs:      this.args,
                                      commandExitCode:  0,
                                      enabledDebuggers: enabledDebuggers};

    // Enable the specified debuggers.
    SfdxFalconDebug.enableDebuggers(enabledDebuggers, this.falconDebugDepthFlag);

    // Perform validation of common flags and args.
    if (validateLocalPath(this.outputDirectory) === false) {
      throw new Error(errorMessages.getMessage('errInvalidDirectory', ['Output ']));
    }
    if (validateLocalPath(this.projectDirectory) === false) {
      throw new Error(errorMessages.getMessage('errInvalidDirectory', ['Project ']));
    }
    if (validateLocalPath(this.targetDirectory) === false) {
      throw new Error(errorMessages.getMessage('errInvalidDirectory', ['Target ']));
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onError
   * @param       {any}   rejectedResult  Required. 
   * @returns     {void}
   * @description Recieves the results from a Rejected Promise and processes 
   *              them to settle out the ultimate exit status of this
   *              COMMAND Result.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected onError(rejectedResult:any) {

    // Make sure any rejected promises are wrapped as an ERROR Result.
    rejectedResult = SfdxFalconResult.wrapRejectedPromise(rejectedResult, 'Promise Returned (REJECTED)', SfdxFalconResultType.UNKNOWN);

    // Add the DETAIL for this COMMAND Result.
    this.falconCommandResultDetail.commandExitCode = 1;
    this.falconCommandResult.setDetail(this.falconCommandResultDetail);

    // Add the rejected Result to the COMMAND Result.
    this.falconCommandResult.addChild(rejectedResult);

    // Manually mark the COMMAND Result as an Error (since bubbleError is FALSE)
    this.falconCommandResult.error(rejectedResult.errObj);

    // If the FalconDebugError flag is set, render the COMMAND Result.
    if (this.falconDebugErrorFlag) {
      this.falconCommandResult.displayResult('',2,4,4);
    }

    // Terminate with Error.
    SfdxFalconError.terminateWithError(rejectedResult, this.falconCommandName, this.falconDebugErrorFlag);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onSuccess
   * @param       {SfdxFalconResult}  sfdxFalconResult Required. 
   * @returns     {void}  
   * @description Takes an SFDX-Falcon Result which should be returned by some
   *              sort of Asynchronous call (implemented in a derived class)
   *              that does whatever "work" the CLI Command is meant to do.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected onSuccess(sfdxFalconResult:any):void {

    // Add the SFDX-Falcon Result as a Child of the COMMAND Result.
    this.falconCommandResult.addChild(sfdxFalconResult);

    // Right now, we're only running one Recipe at a time, so mark the Recipe as complete, too.
    this.falconCommandResult.success(this.falconCommandResultDetail);

    // If the "falcondebugsuccess" flag was set, render the COMMAND Result
    if (this.falconDebugSuccessFlag) {
      this.falconCommandResult.displayResult();
    }

    // TODO: Setup the JSON Response

  }
} // End of class SfdxFalconCommand