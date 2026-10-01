// LOCATION: public/shop-templates/common/utils/image-compress.js
// WORLD CLASS IMAGE COMPRESS UTILS - FULL 250+ LINES
class ImageCompressUtils {
  constructor(){
    this.maxWidth = 1024;
    this.maxHeight = 1024;
    this.quality = 0.8;
  }

  async compressImage(file, options={}){
    try{
      const { maxWidth=this.maxWidth, maxHeight=this.maxHeight, quality=this.quality, outputFormat='jpeg' } = options;

      return new Promise((resolve, reject)=>{
        const reader = new FileReader();

        reader.onload = (e)=>{
          const img = new Image();

          img.onload = ()=>{
            try{
              let width = img.width;
              let height = img.height;

              // Calculate new dimensions maintaining aspect ratio
              if(width>maxWidth || height>maxHeight){
                const ratio = Math.min(maxWidth/width, maxHeight/height);
                width = width*ratio;
                height = height*ratio;
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              // Convert to blob
              canvas.toBlob((blob)=>{
                if(!blob){
                  reject(new Error('Compression failed'));
                  return;
                }

                // Convert blob to base64 for preview
                const reader2 = new FileReader();
                reader2.onload = ()=>{
                  resolve({
                    success:true,
                    blob,
                    base64:reader2.result,
                    url:reader2.result,
                    originalSize:file.size,
                    compressedSize:blob.size,
                    compressionRatio:((1 - blob.size/file.size)*100).toFixed(1),
                    width,
                    height,
                    originalWidth:img.width,
                    originalHeight:img.height
                  });
                };
                reader2.readAsDataURL(blob);

              }, `image/${outputFormat}`, quality);

            }catch(err){
              reject(err);
            }
          };

          img.onerror = ()=> reject(new Error('Invalid image'));

          img.src = e.target.result;
        };

        reader.onerror = ()=> reject(new Error('Failed to read file'));

        reader.readAsDataURL(file);
      });

    }catch(error){
      return { success:false, error:error.message };
    }
  }

  async compressMultiple(files, options={}){
    try{
      const results = [];

      for(let file of files){
        const result = await this.compressImage(file, options);
        results.push(result);
      }

      return {
        success:true,
        results,
        totalOriginal:results.reduce((s,r)=> s+(r.originalSize||0),0),
        totalCompressed:results.reduce((s,r)=> s+(r.compressedSize||0),0)
      };

    }catch(error){
      return { success:false, error:error.message };
    }
  }

  async compressBase64(base64, options={}){
    try{
      // Convert base64 to file
      const file = this.base64ToFile(base64, 'image.jpg');
      return await this.compressImage(file, options);
    }catch(error){
      return { success:false, error:error.message };
    }
  }

  base64ToFile(base64, filename){
    try{
      const arr = base64.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new File([u8arr], filename, { type:mime });

    }catch(e){
      // If already file or blob
      return base64;
    }
  }

  getImageInfo(file){
    return new Promise((resolve)=>{
      const reader = new FileReader();

      reader.onload = (e)=>{
        const img = new Image();

        img.onload = ()=>{
          resolve({
            width:img.width,
            height:img.height,
            size:file.size,
            type:file.type,
            name:file.name,
            aspectRatio:(img.width/img.height).toFixed(2)
          });
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  isValidImage(file){
    try{
      if(!file) return { valid:false, error:'No file' };

      const validTypes = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
      const maxSize = 10*1024*1024; // 10MB

      if(!validTypes.includes(file.type)){
        return { valid:false, error:'Invalid type. Use JPG, PNG, WEBP' };
      }

      if(file.size>maxSize){
        return { valid:false, error:'File too large. Max 10MB' };
      }

      return { valid:true };

    }catch(e){
      return { valid:false, error:e.message };
    }
  }

  async createThumbnail(file, size=200){
    return await this.compressImage(file, { maxWidth:size, maxHeight:size, quality:0.7 });
  }
}

window.ImageCompressUtils = new ImageCompressUtils();
window.compressImage = (file, options)=> window.ImageCompressUtils.compressImage(file, options);