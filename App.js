import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomTabNavigator from './components/BottomTabNavigator';
import { Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';
import * as Font from 'expo-font';

export default class App extends React.Component{

  constructor(){
    super();
    this.state = {
      fonteCarregada: false
    }
  }
  carregarFontes = async()=> {
    await Font.loadAsync({
      Rajdhani_600SemiBold: Rajdhani_600SemiBold
    })

    this.setState({
      fonteCarregada: true
    })
  }

  componentDidMount(){
    this.carregarFontes();
  }

  render(){
    const {fonteCarregada} = this.state;

    if(fonteCarregada){
      return (
        <BottomTabNavigator/>
      );
    }
    else{
      return null;
    }
    
  }
}


