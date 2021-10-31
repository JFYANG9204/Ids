
set wave_flt=(dp_wave*{v1,v2})
set wave_label=ºÏ²¢

mrScriptCL Run_jacc.mrs /d:TOPBREAK="\"\"" /d:OUTPUTNAME="\"Table-Jacc-%wave_label%-Percent\""  /d:table_file="\"tab_jacc.mrs\""  /d:blnCount="\"False\""  /d:blnPercent="\"True\""  /d:SIGTEST1="\"False\"" /d:SIGCOLUMNIDS="\"%sigid%\"" /d:SIGCOLUMNS="\"%sigtest%\""  /d:GLOBALFILTER="\"%wave_flt%\"" /d:GLOBALLABEL="\"Total\"" >> MasterLog.txt
mrScriptCL Run_jacc.mrs /d:TOPBREAK="\"\"" /d:OUTPUTNAME="\"Table-Jacc-%wave_label%-SigTest\""  /d:table_file="\"tab_jacc.mrs\""  /d:blnCount="\"False\""  /d:blnPercent="\"True\""  /d:SIGTEST1="\"True\""  /d:SIGCOLUMNIDS="\"%sigid%\"" /d:SIGCOLUMNS="\"%sigtest%\""  /d:GLOBALFILTER="\"%wave_flt%\"" /d:GLOBALLABEL="\"Total\"">> MasterLog.txt





