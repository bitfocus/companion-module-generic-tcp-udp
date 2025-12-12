# companion-module-generic-tcp-udp

If you are using this plugin,
then it would probably mean that you are using some software that has not been supported yet,
and we would therefore really appreciate if you made a module request for it here:

<https://github.com/bitfocus/companion-module-requests/issues>

In that way, more people will get to benefit from this in the future, thanks.

| Version    | Notes                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| **V1.0.0** | A generic module for performing simple TCP and UDP requests, for more info look in HELP.md              |
| **V1.0.1** | Fixed errors in HELP.md file                                                                             |
| **V1.0.2** | Added the option to chose the end caractors: \r, \n, \r\n, \n\r or none at all.                         |
| **V1.0.5** | Added the option to insert hex codes using the %hh format.                                              |
| **V1.0.6** | pre-encode send buffer as 'latin1' (binary) to prevent 'utf8' escape of 8bit characters                 |
| **V1.0.7** | re-write to ES6                                                                                         |
| **V2.0.0** | Update for Companion 3.0                                                                                |
| **V2.1.0** | Add Send Hex action to replace deprecated `unescape` function<br>Allow host names as well as IP numbers |
| **V2.1.1** | Indicate OK when UDP Listener is started                                                                |
| **V2.1.2** | Use correct function to create send buffer from hex string                                              |
| **V2.1.3** | 'concat' send buffer and end-of-message characters instead of overloaded '+'                            |
| **V2.2.0** | Add leading '0' for odd character length Hex command value                                              |
| **V2.2.1** | Fix spelling error in config text                                                                        |
