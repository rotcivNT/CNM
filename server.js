const express = require('express')
const app = express()
const port = 3000
let courses = require('./data')
const multer = require('multer');
const awsInit = require('./config/awsInit');
const { path } = require('express/lib/application');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
});

function checkFileType () {
  const fileTypes = /jpeg|jpg|png|gif/
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true)
  }
  return cb("Error")
}


app.use(express.urlencoded({ extended: true }))
app.use(express.static('./views'))

app.set('view engine', 'ejs')
app.set('views', './views')

app.get('/', async (req, res) => {
  try {
    const params = {
      TableName: "Product"
    }
    const data = await awsInit.dynamodb.scan(params).promise()
    return res.render("home.ejs", {data: data.Items})
  }
  catch (err) {
    console.log(err)
    return res.status(500).send("Error !")
  }
})

app.post('/save', upload.single('image'), async (req, res) => {
    try {
      const {MaSanPham, TenSanPham, SoLuong} = req.body
      const image = req.file?.originalname.split(".")
      const fileType = image[image.length - 1]
      const filePath = `${MaSanPham}_${Date.now().toString()}.${fileType}`
      const paramsS3 = {
        Bucket: 'demo-s3-bucket-iuh',
        Key: filePath,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }

      awsInit.s3.upload(paramsS3, async (err, data) => {
        if (err) {
          return res.send("Err")
        }
        const imgURL = data.Location
        const paramsDDB = {
          TableName: "Product",
          Item: {
            MaSanPham,
            TenSanPham,
            SoLuong: +SoLuong,
            HinhAnh: imgURL
          }
        }
        await awsInit.dynamodb.put(paramsDDB).promise()

        return res.redirect('/')
      })
    } catch(err) {
      res.status(500).send("Error !")
    }
})

app.post('/delete', upload.fields([]), (req, res) => {
    const listCheckboxSelected = Object.keys(req.body)
  console.log(req.body)
    if (listCheckboxSelected.length <= 0) {
        return res.redirect('/')
    }

    const onDeleteItem = (length) => {
        const params = {
          TableName: "Product",
          Key: {
            MaSanPham: listCheckboxSelected[length]
          }
        }

        awsInit.dynamodb.delete(params, (err, data) => {
          if (err) {
            return res.send("Error !")
          }

          if (length > 0) {
              onDeleteItem(length - 1)
          }
          else {
              return res.redirect('/')
          }
        })
    }

    onDeleteItem(listCheckboxSelected.length - 1)
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})