#inputs
#outputs
#inouts
#static
  rtrig_count: RTRIG
  ton_start: TON
  a: INT
#rungs
  NO[a] - (NO[b], NO[c]) - COIL[o]
  NO[en] - ADD_INT[a, b, y] - ADD_INT[y, 1, y]
  (NO[start] - ton_start[3], NO[motor]) - NC[stop] - COIL[motor]
  NO[true] - (NO[btn] - PWM_Write[120], NC[btn] - PWM_Write[0]) - COIL[test]
  NO[btn] - rtrig_count[] - ADD_INT[a, 1, a]


