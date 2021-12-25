#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <stdbool.h>

bool NO(bool src) { return src; }
bool NC(bool src) { return !src; }
bool COIL(bool en, bool * dest) { *dest = en; return en; }
bool SET(bool* dest) { *dest = true; return true; }
bool RESET(bool *dest) { *dest = false; return true; }


bool ReadInput(int pin) {
  return digitalRead(pin);
}

bool WriteOutput(bool en, int pin) {
  digitalWrite(pin, en);
  return true;
}

typedef struct {

} s_TON;

bool TON(bool en, s_TON *inst, int delay) {
  return true;
}

bool PWM_Write(int value) {
  return true;
}

bool ADD_INT(int a, int b, int *c) {
  *c = a + b;
  return true;
}

typedef struct {
  bool lastValue;
} s_RTRIG;

bool RTRIG(bool en, s_RTRIG *inst) {
  bool ret = (en == true) && (inst->lastValue == false);
  inst->lastValue = en;
  return ret;
}