function scrollToSection(sectionId) {
    var section = document.getElementById(sectionId);
    setTimeout(function () {
        section.scrollIntoView({ behavior: 'smooth' });
    }, 200); // Adjust the timeout value for transition
}