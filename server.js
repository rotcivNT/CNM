const express = require('express')
const app = express()
const port = 3000
let courses = require('./data')
const multer = require('multer');
const s3 = require('./config/s3Config')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
});
app.use(express.urlencoded({ extended: true }))
app.use(express.static('./views'))

app.set('view engine', 'ejs')
app.set('views', './views')

app.get('/', (req, res) => {
    return res.render('home', {courses})
})

app.post('/save', upload.single('file'), (req, res) => {
    const {id, name, course_type, semester, department} = req.body
    const params = {
        id: +id,
        name,
        course_type, 
        semester,
        department
    }

    console.log(req.body.file)

    const s3Params = {
        Bucket: 'demo-s3-bucket-iuh',
        Key: req.body.file.originalname,
        Body: req.body.file.buffer,
      };
    
      s3.upload(s3Params, (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error uploading file');
        }
    
        res.send('File uploaded successfully');
      });

    courses.push(params)

    return res.redirect('/')
})

app.post('/delete', (req, res) => {
    const listCheckboxSelected = Object.keys(req.body)
    console.log(listCheckboxSelected)

    if (listCheckboxSelected.length <= 0) {
        return res.redirect('/')
    }

    const onDeleteItem = (length) => {
        const maCanXoa = +listCheckboxSelected[length]
        courses = courses.filter (item => item.id !== maCanXoa)

        if (length > 0) {
            onDeleteItem(length - 1)
        }
        else {
            return res.redirect('/')
        }
    }

    onDeleteItem(listCheckboxSelected.length - 1)
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})