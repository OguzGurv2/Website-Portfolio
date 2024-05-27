document.addEventListener("DOMContentLoaded", () => {
    const photoWrapper = document.querySelector(".img-wrapper");
    const photoBorder = document.querySelector(".img-border");
    const rootStyles = getComputedStyle(document.documentElement);
    const linkColor = rootStyles.getPropertyValue("--link").trim();
    const primaryColor = rootStyles.getPropertyValue("--primary").trim();

    photoWrapper.addEventListener("mouseover", ()=> {
        photoBorder.style.borderColor = `${linkColor}`;
    });

    photoWrapper.addEventListener("mouseout", ()=> {
        photoBorder.style.borderColor = `${primaryColor}`;
    });
});