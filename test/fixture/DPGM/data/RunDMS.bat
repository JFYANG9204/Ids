::mrScriptCL Library\log1.mrs /a:BATCH_FILE=".\RunDMS.bat"

::set WaveNoCode=W01
::mrScriptCL %WaveNoCode%\UpdateData.mrs /d:WAVE_NO="\"%WaveNoCode%\"" >> MasterLog_UpdateData.txt
::DMSRun clean.dms /d"WAVE_NO \"%WaveNoCode%\"" /d"WAVE_METADATA \"%WaveNoCode%\sbMetadata_dms.mrs\"" /d"WAVE_NEXTCASE \"%WaveNoCode%\sbOnNextCase.mrs\"" /d"WAVE_CORRECTIONS \"%WaveNoCode%\corrections.inc\"" /d"WAVE_WEIGHT \"%WaveNoCode%\sbWeighting.mrs\"" /d"QUERY_FILTER \"where Respondent.Serial ^> 0\"" >> MasterLog.txt
@rem DMSRun Clean_SplitAccelerated.dms /d"WAVE_NO \"%WaveNoCode%\"" /d"RESP_QES Respondent.Serial" /d"NUMBEROFTHREADS 7" >> MasterLog.txt

set WaveNoCode=W02
mrScriptCL %WaveNoCode%\UpdateData.mrs /d:WAVE_NO="\"%WaveNoCode%\"" >> MasterLog_UpdateData.txt
DMSRun clean.dms /d"WAVE_NO \"%WaveNoCode%\"" /d"WAVE_METADATA \"%WaveNoCode%\sbMetadata_dms.mrs\"" /d"WAVE_NEXTCASE \"%WaveNoCode%\sbOnNextCase.mrs\"" /d"WAVE_CORRECTIONS \"%WaveNoCode%\corrections.inc\"" /d"WAVE_WEIGHT \"%WaveNoCode%\sbWeighting.mrs\"" /d"QUERY_FILTER \"where Respondent.Serial ^> 0\"" >> MasterLog.txt

DMSRun MergeData.dms >> MasterLog.txt
