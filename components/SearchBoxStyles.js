import { Dimensions } from 'react-native';
var width = Dimensions.get('window').width; //full width
const styles = {
  searchBox: {
    top: 0,
    position: 'absolute',
    width: width,
  },
  inputWrapper: {
    marginLeft: 15,
    marginRight: 10,
    marginTop: 30,
    marginBottom: 0,
    backgroundColor: '#fff',
    opacity: 0.9,
    borderRadius: 7,
  },
  inputSearch: {
    fontSize: 18,
  },
  buttonSearch: {
    width: width * 0.2,
    marginTop: 0,
    marginBottom: 0,
    opacity: 1,
    backgroundColor: 'gray',
  },
};

export default styles;
