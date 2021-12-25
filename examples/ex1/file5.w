#inputs
  start: bool
  stop: bool
#outputs
#inouts
#static
  motor: bool
  cnt: int
  rtrig_start: RTRIG
#temp
  //start: bool
  //stop: bool
#const
#rungs
  //ReadInput[0] - COIL[start]
  //ReadInput[1] - COIL[stop]
  (NO[start], NO[motor]) - NC[stop] - COIL[motor]
  //NO[motor] - WriteOutput[2]
  NO[start] - rtrig_start[] - ADD_INT[cnt, 1, cnt]
