# Emulators

Emulators are used to benchmark and test blockchain operations together with other features in the application context. The principle is that the developer knows possible interactions that they should develop so they can write some simple emulators for benchmarks.

## Current emulators

* v2x communicator: emulators for vehicle communication


## Developing new emulators

You can develop a new emulator for testing interactions you want with other blockchain systems.
We provide a list of guidelines, your emulator should follow, to make its interaction with the framework simpler.
* The emulator has to interact with a blockchain instance.
* The emulator is an application, which is deployed and executed by the framework, along with all of its dependencies. To make that simple, we recommend to pack the emulator to a closed contanerized environment (docker etc.).
* The application should indicate (in some form) to the framework, when the simulation has finished.
* The result produced by the emulator must be mappeable to the quality metrics supported by the framework.
* We recommend to store the results to a file, such that the framework can pull that, when the simulation is finished.