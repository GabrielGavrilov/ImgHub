# ImgHub - An image sharing platform. 

ImgHub is an image sharing platform that was intended for users on mobile phones. ImgHub was not actually built for hosting, since this is suppose to be a representation on how image sharing social networks (such as like Instagram) work front-end and back-end. 

<p align="center">Mobile Preview</p>

<p align="center">
  <img src="https://user-images.githubusercontent.com/79603829/141690352-8d3a163d-a9d6-44bb-99f0-a04b78b1b4a4.png"/>
</p>

## Getting Started

1) Make sure you have Node.JS & NPM installed on your system.
2) Clone the GitHub repository onto your system.
3) Open the command terminal on the cloned repository's folder.
4) Install the required liberaries by typing``npm install`` in the command terminal.
5) Open the ``ServerSettings.json`` file.
6) On the file, enter your MongoDB's connection url.
7) Choose a Secret Key (optional)
8) Run the program by typing ``npm start`` in the command terminal.

## Features

- Responsive web design (Desktop & Mobile support)
- User profiles
- Liking images
- Commenting on images
- Individual image pages
- Admin support (Admins are able to delete images)
- File upload filters (Only image files are uploaded, other files such as video files will stop the upload process)

## Programming Languages

- ImgHub's back-end was written in Node.JS,
- ImgHub's front-end was written in EJS (HTML templating language) & CSS,
- Private server constants (``ServerSettings.json``) are stored in a JSON file,
- ImgHub's Database is inteded for MongoDB.
