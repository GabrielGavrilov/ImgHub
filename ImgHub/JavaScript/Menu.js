var menuIcon = document.querySelector('.hamburger-menu')
var navBar = document.querySelector('.navbar')
var closeButton = document.querySelector('.close-menu')

menuIcon.addEventListener("click", function(){
    navBar.classList.toggle("change")
})

closeButton.addEventListener("click", function() {
    navBar.classList.toggle("change")
})