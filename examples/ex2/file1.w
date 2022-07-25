#inputs
	speed : INT
#outputs
#inouts
#static
	servo1 : Servo()
	val : INT
	up : BOOL
	down : BOOL
#temp
#setup
	servo1.attach(1)
	MOVE(0, val)
#loop
  ReadInput(0) - COIL(up)
  ReadInput(1) - COIL(down)
	NO(up) - ADD(val, speed, val)
	NO(down) - SUB(val, speed, val)
	servo1.write(val)