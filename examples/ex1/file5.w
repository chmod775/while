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
  A: bool
  B: bool
  C: bool
  D: bool
  E: bool
  F: bool
  G: bool
  H: bool
  I: bool
  J: bool
  K: bool
  L: bool
  M: bool
  N: bool
  O: bool
  P: bool
  Q: bool
  R: bool
  S: bool
  Z: bool
#const
#rungs
  //ReadInput[0] - COIL[start]
  //ReadInput[1] - COIL[stop]
  (NO[start], NO[motor]) - NC[stop] - COIL[motor]
  //NO[motor] - WriteOutput[2]
  NO[start] - rtrig_start[] - ADD_INT[cnt, 1, cnt]


  ((NO[A], NO[B]) - NO[D] - (NO[E] - NO[G], NO[F] - ((NO[H], NO[I]) - NO[K], NO[J]), NO[O] - (NO[P], NO[Q]) - NO[R] - NO[S]) - NO[L], NO[C]) - (NO[M], NO[N]) - COIL[Z]
  ((NO[A], NO[B]) - NO[D] - (NO[E] - NO[G], NO[F] - ((NO[H], NO[I]) - NO[K], NO[J])) - NO[L], NO[C]) - (NO[M], NO[N]) - COIL[Z]

  ((NO[A], NO[B]) - NO[D] - (NO[E] - NO[G], NO[F] - ((NO[H], NO[I]) - NO[K], NO[J]), NO[O]) - NO[L], NO[C]) - (NO[M], NO[N]) - COIL[Z]