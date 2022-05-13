#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <stdbool.h>


bool NO(bool src) { return src; }
bool NC(bool src) { return !src; }
bool COIL(bool en, bool * dest) { *dest = en; }
bool SET(bool* dest) { *dest = true; return true; }
bool RESET(bool *dest) { *dest = false; return true; }

typedef struct {
  bool lastValue;
} s_RTRIG;

bool RTRIG(bool en, s_RTRIG *inst) {
  bool ret = (en == true) && (inst->lastValue == false);
  inst->lastValue = en;
  return ret;
}


typedef struct {
	bool motor;
	int cnt;
	s_RTRIG rtrig_start;
} s_file5;

void file5(s_file5 *inst, bool start, bool stop) {

	bool t0 = true ? NO(start) : false;
	bool t1 = true ? NO(inst->motor) : false;
	bool t2 = t0 || t1;
	bool t3 = t2 ? NC(stop) : false;
	bool t4 = COIL(t3, &inst->motor);
	
	bool t5 = true ? NO(start) : false;
	bool t6 = RTRIG(t5, &inst->rtrig_start);
	bool t7 = t6 ? ADD_INT(inst->cnt, 1, &inst->cnt) : false;
	
}



void print(bool val) {
  printf("Value: %d\n", val);
}

void main() {
  s_file5 inst;
  inst.cnt = 0;


  file5(&inst, false, false);
  print(inst.motor);

  file5(&inst, true, false);
  print(inst.motor);

  file5(&inst, true, false);
  print(inst.motor);

  file5(&inst, true, false);
  print(inst.motor);

  file5(&inst, false, false);
  print(inst.motor);

  file5(&inst, false, true);
  print(inst.motor);

  file5(&inst, false, false);
  print(inst.motor);

  file5(&inst, true, false);
  print(inst.motor);

  printf("cnt: %d\n", inst.cnt);
}


bool       
ADD_INT(int a,
int b,
int *c) {
  *c = a + b;
  return true;
}