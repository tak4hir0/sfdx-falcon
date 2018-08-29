//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/project/clone.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Implements the CLI command "falcon:project:clone"
 * @description   Salesforce CLI Plugin command (falcon:project:clone) that allows a Salesforce DX
 *                developer to clone an existing project based on the SFDX-Falcon template.  After
 *                the project code is cloned, the user is taken through an interview to help set up
 *                developer-specific project variables.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// External Imports
//import {SfdxCommand}                  from  '@salesforce/command';                          // The CLI command we build must extend this class.
import {Messages}                     from  '@salesforce/core';                             // Messages library that simplifies using external JSON for string reuse.
import {flags}                        from  '@oclif/command';                               // Requried to create CLI command flags.

// Local Imports
import {SfdxFalconYeomanCommand}      from  '../../../modules/sfdx-falcon-yeoman-command';  // Base class that CLI commands in this project that use Yeoman should use.
import {SfdxFalconCommandType}        from  '../../../modules/sfdx-falcon-command'; // Why?

// Use SfdxCore's Messages framework to get the message bundle for this command.
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-falcon', 'falconProjectClone');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconProjectClone
 * @extends     SfdxFalconYeomanCommand
 * @summary     Implements the CLI Command "falcon:project:clone"
 * @description The command "falcon:project:clone" allows a Salesforce DX developer to clone an
 *              existing project based on the SFDX-Falcon template.  After the project is cloned,
 *              the user is taken through an interview to help set up developer-specific project
 *              variables.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconProjectClone extends SfdxFalconYeomanCommand {

  // Define the basic properties of this CLI command.
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:project:clone git@github.com:GitHubUser/my-repository.git`,
    `$ sfdx falcon:project:clone https://github.com/GitHubUser/my-repository.git`,
    `$ sfdx falcon:project:clone https://github.com/GitHubUser/my-repository.git \\
                           --outputdir ~/projects/sfdx-falcon-projects`
  ];

  // Identify the core SFDX arguments/features required by this command.
  protected static requiresProject        = false;  // True if an SFDX Project workspace is REQUIRED.
  protected static requiresUsername       = false;  // True if an org username is REQUIRED.
  protected static requiresDevhubUsername = false;  // True if a hub org username is REQUIRED.
  protected static supportsUsername       = false;  // True if an org username is OPTIONAL.
  protected static supportsDevhubUsername = false;  // True if a hub org username is OPTIONAL.
  
  //───────────────────────────────────────────────────────────────────────────┐
  // Define the ARGUMENTS used by this command. 
  // Position 1 (GIT_REMOTE_URI)  - URI of the git repository being cloned.
  //───────────────────────────────────────────────────────────────────────────┘
  public static args = [
    {
      name: 'GIT_REMOTE_URI',
      description: messages.getMessage('gitRemoteUriArgDescription'),
      required: true,
      hidden: false
    }
  ];

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the FLAGS used by this command.
  // -d --OUTPUTDIR   Directory where AppX Demo Kit (ADK) project will be cloned
  //                  to.  Defaults to . (current directory) is not specified.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    outputdir: flags.string({
      char: 'd', 
      description: messages.getMessage('outputdirFlagDescription'),
      default: '.',
      required: false,
      hidden: false
    }),
    // IMPORTANT! The next line MUST be here to import the FalconDebug flags.
    ...SfdxFalconYeomanCommand.falconBaseflagsConfig
  };

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    run
   * @returns     {Promise<any>}  Resolves with a JSON object that the CLI will
   *              pass to the user as stdout if the --json flag was set.
   * @description Entrypoint function for "sfdx falcon:project:clone".
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> {

    // Initialize the SfdxFalconCommand (required by ALL classes that extend SfdxFalconCommand).
    this.sfdxFalconCommandInit('falcon:demo:clone', SfdxFalconCommandType.APPX_PACKAGE);

    // Run a Yeoman Generator to interact with and run tasks for the user.
    await super.runYeomanGenerator({
      generatorType:    'clone-falcon-project',
      gitRemoteUri:     this.gitRemoteUri,
      outputDir:        this.outputDirectory,
      options: []
    })
    .then(statusReport => {this.onSuccess(statusReport)}) // <-- Preps this.falconJsonResponse for return
    .catch(error => {this.onError(error)});               // <-- Wraps any errors and displays to user

    // Return the JSON Response that was created by onSuccess()
    return this.falconJsonResponse;
  }
}