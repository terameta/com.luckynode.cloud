echo off
cls

set SL=("HyS9FoundationServices" "opmn_EPM_epmsystem1" "OracleProcessManager_ohsInstance3193331783" "HyS9eas" "Essbase Integration Server" "HyS9aps" "Hyperion RMI Registry" "HyS9Planning" "HyS9EPMADataSynchronizer" "EPMA_Server" "HyS9EPMAWebTier" "HyS9CALC" "HyS9RaFrameworkAgent" "HyS9RaFramework" "HyS9FRReports" "Hyperion Studio Service BPMS bpms1" "HyS9FDMTaskManagerSrv" "Hyperion S9 Financial Management DME Listener" "Hyperion S9 Financial Management Service" "HFMWebServiceManager" "HyS9FinancialManagementWebSvcs" "HyS9FRPrint")
for %%i in %SL% do call:MyFunc %%i

goto:END

:MyFunc
	ECHO :::::::::::::::::::::::::::::::::::::::::::::::::::::::
	ECHO Stopping Service: "%~1"
	net stop "%~1" > nul
	sc query "%~1" | find "STATE" | FIND "RUNNING"
	echo %errorlevel%
	IF %errorlevel% == 0 goto :eof
	
goto:eof


:END