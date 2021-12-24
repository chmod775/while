#define test 1

// hello comment
/*


hello biiiiiiiiiiig

comment
 

  
   
    
     




                */
              

test abc() {}
bool NO(bool src) { return src; }
bool NC(bool src) { return !src; }
bool COIL(bool en, bool * dest) { *dest = en; }
bool SET(bool* dest) { *dest = true; return true; }
bool RESET(bool *dest) { *dest = false; return true; }


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