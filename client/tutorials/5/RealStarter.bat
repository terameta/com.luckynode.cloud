echo off
cls

set SL=("HyS9FoundationServices" "opmn_EPM_epmsystem1" "HyS9eas" "Essbase Integration Server" "HyS9aps" "Hyperion RMI Registry" "HyS9Planning" "HyS9EPMADataSynchronizer" "EPMA_Server" "HyS9EPMAWebTier" "HyS9CALC" "HyS9RaFrameworkAgent" "HyS9RaFramework" "HyS9FRReports" "HyS9FDMTaskManagerSrv" "Hyperion S9 Financial Management DME Listener" "Hyperion S9 Financial Management Service" "HFMWebServiceManager" "HyS9FinancialManagementWebSvcs" "HyS9FRPrint")
for %%i in %SL% do call:MyFunc %%i

goto:END

:MyFunc
	ECHO :::::::::::::::::::::::::::::::::::::::::::::::::::::::
	ECHO Starting Service: "%~1"
	net start "%~1" > nul
	sc query "%~1" | find "STATE" | FIND "RUNNING"
	echo %errorlevel%
	IF %errorlevel% == 0 goto :eof
	call:MyFunc "%~1"
goto:eof


:END