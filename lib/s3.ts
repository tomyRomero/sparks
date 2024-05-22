"use client"

export const getImageData = async (key: string) => {
   
    const encodedKey = encodeURIComponent(key);
    const getResponse = await fetch(`/api/S3?key=${encodedKey}`, {
      method: 'GET'
    });

    if (getResponse.ok) {
      // Request was successful, handle the response
      const getResponseData = await getResponse.json();
      const match = key.match(/[^.]+$/);
      const result = match ? match[0] : 'jpg';
      
      let base64 = `data:image/${result};base64,` + getResponseData;
      return base64;
      
    } else {
      // Request failed, handle the error
      console.error('Error:', getResponse.statusText);
      return '/assets/profile.svg'
    }
  }  


  export const postImage = async (data: any) => {
    const response = await fetch('/api/S3', {
      method: 'POST',
      body: JSON.stringify(data), // Convert your data to JSON
    });
    
    if (response.ok) {
      // Request was successful, handle the response
      const responseData = await response.json();
      return responseData.filename;
    } else {
      // Request failed, handle the error
      console.error('Error:', response.statusText);
      alert(`There Was An Error Finishing Your Profile, Please Try Again, Error: ${response.statusText}`);
      return false;
    }
  }

  export const getRes = async (imgUrl: string)=> {
    
    console.log("imgUrl", imgUrl )

      try {
        let imgResult = '/assets/profile.svg';
        if (imgUrl.startsWith('user')) {
          const res = await getImageData(imgUrl);
          imgResult = res;
        } else {
          imgResult = imgUrl;
        }

        return imgResult
      } catch (error) {
        console.log("Error", error);
        return '/assets/profile.svg'
      }
    }
    
  