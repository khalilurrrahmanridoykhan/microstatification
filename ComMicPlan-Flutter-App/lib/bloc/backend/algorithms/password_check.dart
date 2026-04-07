class PasswordCheck {
  bool checkPassword(String value){
    bool capital = false;
    bool number = false;
    bool space = false;
    bool special = false;
    bool small = false;
    bool minimumLength = false;
    for (int i = 0; i < value.length; i++) {
      if (value[i].contains(RegExp(r'[A-Z]'))) {
        capital = true;
      } else if (value[i].contains(RegExp(r'[0-9]'))) {
        number = true;
      } else if (value[i] == ' ') {
        space = true;
      } else if(value[i].contains(RegExp(r'[a-z]'))){
        small = true;
      }
      else {
        special = true;
      }
    }
    if(value.length>=8){
      minimumLength = true;
    }
    if (capital && number && !space && special && small && minimumLength) {
      return true;
    }
    else{
      return false;
    }
  }
}