async function togglePin(blogId, isPinned) {
    try {
        const response = await fetch(`/pin/${blogId}`, { method: "POST" });
        if (response.ok) {
            // Update UI
            const blogCard = document.getElementById(`blog-${blogId}`);
            if (blogCard) {
                blogCard.style.border = isPinned ? "none" : "3px solid gold";
                blogCard.style.backgroundColor = isPinned ? "white" : "#fffbe6";

                // Update button text
                const btn = blogCard.querySelector(".pin-btn");
                btn.innerText = isPinned ? "Pin" : "Unpin";

                // Move pinned blogs to the top
                reorderBlogs();
            }
        }
    } catch (error) {
        console.error("Error pinning blog:", error);
    }
}

function reorderBlogs() {
    const container = document.querySelector(".home-container");
    const blogs = Array.from(container.children);

    blogs.sort((a, b) => {
        const isPinnedA = a.style.border.includes("gold");
        const isPinnedB = b.style.border.includes("gold");
        return isPinnedB - isPinnedA;
    });

    blogs.forEach(blog => container.appendChild(blog)); // Reorder in DOM
}