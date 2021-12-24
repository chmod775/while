#inputs
#outputs
#inouts
#static
  rtrig_count: RTRIG
  a: INT
#rungs
  NO[true] - (NO[btn] - PWM_Write[120], NC[btn] - PWM_Write[0]) - COIL[test]
  NO[btn] - rtrig_count[] - ADD[a, 1, a]



