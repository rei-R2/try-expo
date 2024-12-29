import { View, StyleSheet, Button, Platform, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import * as Print from 'expo-print';
import React, { useEffect, useState } from 'react';
import { shareAsync } from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';


const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  </head>
  <body style="text-align: center;">
    <h1 style="font-size: 50px; font-family: Helvetica Neue; font-weight: normal;">
      Hello Expo!
    </h1>
    <img
      src="https://d30j33t1r58ioz.cloudfront.net/static/guides/sdk.png"
      style="width: 90vw;" />
    <p style="font-size: 16px; font-family: Helvetica Neue; font-weight: normal;">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ab ut nobis totam, hic magnam quibusdam? Animi consequatur dignissimos soluta, pariatur blanditiis voluptatem dicta in quod provident aspernatur beatae temporibus maiores!</p>
  </body>
</html>
`;

const imagesDir = FileSystem.documentDirectory + "upload/images/";
const ensureDirExist = async () => {
  const dirInfo = await FileSystem.getInfoAsync(imagesDir)
  if(!dirInfo.exists) {
   await FileSystem.makeDirectoryAsync(imagesDir, {intermediates: true})
  }
}

export default function ExploreScreen() {
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    ensureDirExist()
    const files = await FileSystem.readDirectoryAsync(imagesDir)
    setImages(files.map(file => imagesDir + file))
  }

  const print = async () => {
    // On iOS/android prints the given html. On web prints the HTML from the current page.
    await Print.printAsync({
      html,
    });
  };

  const printToFile = async () => {
    // On iOS/android prints the given html. On web prints the HTML from the current page.
    const { uri } = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', uri);

    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    try {
      const imageUri = result.assets![0].uri
      // uploadImage(imageUri)
      saveImage(imageUri)
    } catch (error) {
      console.error("Gagal membuat File:", error);
    }
    
  };

  const saveImage = async (imageUri: string) => {
    ensureDirExist()
    const filename = Date.now() + ".jpg"
    const dest = imagesDir + filename
    await FileSystem.copyAsync({from: imageUri, to:dest})
    setImages([...images, dest])
  } 

  const uploadImage = async (imageUri: string) => {
    const response = await FileSystem.uploadAsync("http://10.0.0.28:3000/upload", imageUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: "avatar"
    })
    if(response.status !== 200) throw new Error("Something was wrong!")
  }

  const deleteImage = async (imageUri: string) => {
    await FileSystem.deleteAsync(imageUri)
    setImages(state => state.filter(imgUri => imgUri !== imageUri))
  }

  const renderItem = ({item} : {item: string}) => {
    return <View style={{marginTop: 10, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between"}}>
      <Image source={{uri: item}} style={{width: 100, height: 100, objectFit: "cover"}} />
      <View style={{flexDirection: "row", columnGap: 5}}>
        <TouchableOpacity onPress={() => uploadImage(item)} style={{padding: 5, backgroundColor: "#bfdbfe", width: 100}}>
          <Text style={{textAlign: "center"}}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteImage(item)} style={{padding: 5, backgroundColor: "#bfdbfe", width: 100}}>
          <Text style={{textAlign: "center"}}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  }

  console.log(images)
  return (
    <SafeAreaView style={styles.container}>
      <Button title="Print" onPress={print} />
      <Button title="Print to PDF file" onPress={printToFile} />
      <Button title='Upload' onPress={pickImage} />

      <View style={styles.imgList}>
        <Text>My Images:</Text>
        <FlatList data={images} keyExtractor={(_, i) => i.toString()} renderItem={renderItem}  />
      </View>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 8,
    paddingTop: 20,
    rowGap: 15
  },
  imgList: {
    marginTop: 30
  },
  printer: {
    textAlign: 'center',
  },
});
