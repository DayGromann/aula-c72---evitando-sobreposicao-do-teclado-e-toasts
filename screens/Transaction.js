import * as React from 'react';
import { 
      StyleSheet,
      TextInput,
      Text,
      View,
      TouchableOpacity,
      ImageBackground,
      Image,
      KeyboardAvoidingView,
      ToastAndroid
} from 'react-native';
//import * as Permissions from "expo-permissions"; --> Não está sendo usado <--
import { BarCodeScanner } from 'expo-barcode-scanner';
import { shouldUseActivityState } from 'react-native-screens';

import {addDoc, collection, doc, getDoc, updateDoc, increment} from "firebase/firestore"
import {db} from "../config"


const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

import { firebase } from '@react-native-firebase/firestore';

//esses dois códigos são para ignorar as mensagem em amarelo de "Setting a timer for a long..." no console
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Setting a timer']);

export default class Transaction extends React.Component{
    
  constructor(props){
    super(props);
    this.state = {
      domState : "normal",
      hasCameraPermissions: null,
      scanned: false,
      bookId: "",
      studentId: "",
      bookName: "",
      studentName: ""
    }
    
  }
   
  getCameraPermissions = async(domState)=>{

    const {status} = await BarCodeScanner.requestPermissionsAsync()
    //const {status} = await Permissions.askAsync(Permissions.CAMERA); -->Essa aqui está obsoleta<--

    this.setState({
      hasCameraPermissions: status === "granted",
      domState: domState,
      scanned: false
    })
  }

  handleBarCodeScanned = async({type, data})=>{
    const {domState} = this.state;
    if(domState === "bookId"){
      this.setState({
        bookId: data,
        domState: "normal",
        scanned: true
      })
    }else if(domState === "studentId"){
      this.setState({
        studentId: data,
        domState: "normal",
        scanned: true
      })
    }

    
  }
  
  handleTransaction = async() => {
    var { bookId } = this.state;
    var { studentId } = this.state;

    await this.getBookDetails(bookId);
    await this.getStudentDetails(studentId);

    const bookDoc = doc(db,"books",bookId)

    getDoc(bookDoc)
      .then((doc) => {
        if (doc.exists) {
          var book = doc.data();

          if (book.is_book_available) {
            var {bookName, studentName} = this.state
            this.initiateBookIssue(bookId, studentId, bookName, studentName);
            ToastAndroid.show("Retirada de livro cadastrada com sucesso", ToastAndroid.SHORT)
          } else {
            var {bookName, studentName} = this.state
            this.initiateBookReturn(bookId, studentId, bookName, studentName);
            ToastAndroid.show("Devolução cadastrada com sucesso", ToastAndroid.SHORT)
          }
         
        }
        else {
          alert("documento não localizado, tente novamente")
        }
      })
      .catch((error) => {
        alert(error.message)
      })
  }

  initiateBookIssue = (bookId,studentId, bookName, studentName) => {
    
    var transactionsRef = collection(db, "transactions")
    var bookRef = doc(db, "books", bookId)
    var studentRef = doc(db, "students", studentId)

    addDoc(transactionsRef,{
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "issue"
    })

    updateDoc(bookRef,{
      is_book_available: false
    })

    updateDoc(studentRef, {
      //Esse código incrementa o valor do campo em 1
      number_of_books_issued: increment(1) 
    })

    this.setState({
      bookId: "",
      studentId: ""
    })

  };

  initiateBookReturn = (bookId,studentId, bookName, studentName) => {

    var transactionsRef = collection(db, "transactions")
    var bookRef = doc(db, "books", bookId)
    var studentRef = doc(db, "students", studentId)

    addDoc(transactionsRef,{
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "return"
    })

    updateDoc(bookRef,{
      is_book_available: true
    })

    updateDoc(studentRef, {
      //Esse código incrementa o valor do campo em 1
      number_of_books_issued: increment(-1) 
    })

    this.setState({
      bookId: "",
      studentId: ""
    })
  };

  getBookDetails=(bookId)=>{
    bookId = bookId.trim()
    const bookRef = doc(db, "books", bookId)
    
    getDoc(bookRef).then(doc => {
      this.setState({
        bookName : doc.data().book_name
      })
    })
    
  }

  getStudentDetails=(studentId)=>{
    studentId = studentId.trim()
    const studentRef = doc(db, "students", studentId)
    
    getDoc(studentRef).then(doc => {
      this.setState({
        studentName : doc.data().student_name
      })
    })

  }

  render(){
    const {domState, hasCameraPermissions, bookId, studentId, scanned} = this.state;
    
    if(domState !== "normal"){
      return(
        <BarCodeScanner
          onBarCodeScanned = {scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      )
    }

    return(
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <ImageBackground source={bgImage} style={styles.bgImage}>
          <View style = {styles.upperContainer}>
            <Image source={appIcon} style={styles.appIcon} />
            <Image source={appName} style={styles.appName} />
          </View>
          <View style={styles.lowerContainer}>
            <View style = {styles.textinputContainer}>
              <TextInput 
                style={styles.textinput}
                placeholder={"ID do Livro"}
                placeholderTextColor={"#FFFFFF"}
                value={bookId}
                onChangeText = {text => this.setState({bookId: text})}
              />
              <TouchableOpacity style = {styles.scanbutton} onPress={()=>{this.getCameraPermissions("bookId")}}>
                <Text style = {styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textinputContainer, { marginTop: 25 }]}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do Estudante"}
                placeholderTextColor={"#FFFFFF"}
                value={studentId}
                onChangeText = {text => this.setState({studentId: text})}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("studentId")}
            >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.button, {marginTop:25}]}
              onPress = {this.handleTransaction}
            >
                <Text style={styles.buttonText}>
                  Enviar
                </Text>
            </TouchableOpacity>

          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    )
  }
}

const styles = StyleSheet.create({
    container: {
      flex:1
    },
    text: {
      color: "#ffff",
      fontSize: 15
    },
    button: {
      width: "43%",
      height: 55,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "magenta",
      borderRadius: 15,
      
    },
    buttonText: {
      fontSize: 20,
      borderColor: "black",
      fontFamily: "Rajdhani_600SemiBold",
    },
    textinputContainer: {
      borderWidth: 2,
      borderRadius: 10,
      flexDirection: "row",
      backgroundColor: "#9DFD24",
      borderColor: "#FFFFFF"
    },
    textinput: {
      width: "57%",
      height: 50,
      padding: 10,
      borderColor: "#FFFFFF",
      borderRadius: 10,
      borderWidth: 3,
      fontSize: 18,
      backgroundColor: "#5653D4",
      fontFamily: "Rajdhani_600SemiBold",
      color: "#FFFFFF"
    },
    scanbutton: {
      width: 100,
      height: 50,
      backgroundColor: "magenta",
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      justifyContent: "center",
      alignItems: "center"
    },
    scanbuttonText: {
      fontSize: 20,
      color: "#0A0101",
      fontFamily: "Rajdhani_600SemiBold"
    },
    bgImage: {
      flex: 1,
      resizeMode: "cover",
      justifyContent: "center"
    },
    upperContainer: {
      flex: 0.5,
      justifyContent: "center",
      alignItems: "center"
    },
    appIcon: {
      width: 200,
      height: 200,
      resizeMode: "contain",
      marginTop: 80
    },
    appName: {
      width: 180,
      resizeMode: "contain"
    },
    lowerContainer: {
      flex: 0.5,
      alignItems: "center"
    },
  });

