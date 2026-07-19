const supabaseUrl = "https://wyfpcfzvylmjufambbyx.supabase.co";
const supabaseKey = "sb_publishable_QanNdAoA_4FpDd2or0IM9w_AEKq0l-j";

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);

let editingId = null;

const input = document.querySelector("#search");
const grid = document.querySelector(".grid");

const newNoteBtn = document.querySelector("#newNoteBtn");
const noteForm = document.querySelector("#noteForm");
const saveNoteBtn = document.querySelector("#saveNoteBtn");
const closeBtn = document.querySelector("#closeBtn");

const noteTitleInput = document.querySelector("#noteTitle");
const noteContentInput = document.querySelector("#noteContent");
const noteColorInput = document.querySelector("#noteColor");

newNoteBtn.addEventListener("click", () => {
    editingId = null;
    noteTitleInput.value = "";
    noteContentInput.value = "";
    noteForm.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
    noteForm.style.display = "none";
});

saveNoteBtn.addEventListener("click", async () => {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const color = noteColorInput.value;

    if (title === "" || content === "") {
        alert("Fill everything!");
        return;
    }

    if (editingId !== null) {
        const { error } = await supabaseClient
            .from("notes")
            .update({ title, content, color })
            .eq("id", editingId);

        if (error) console.log("Update error:", error);
        editingId = null;
    } else {
        const newNote = {
            title: title,
            content: content,
            date: new Date().toLocaleDateString(),
            color: color
        };
        const { error } = await supabaseClient
            .from("notes")
            .insert(newNote);

        if (error) console.log("Insert error:", error);
    }

    await renderNotes();

    noteForm.style.display = "none";
    noteTitleInput.value = "";
    noteContentInput.value = "";
});

async function renderNotes(searchTerm = "") {
    grid.innerHTML = "";

    const { data, error } = await supabaseClient.from("notes").select("*");

    if (error) {
        console.log("Fetch error:", error);
        return;
    }

    const filtered = searchTerm
        ? data.filter(note =>
              note.title.toLowerCase().includes(searchTerm) ||
              note.content.toLowerCase().includes(searchTerm)
          )
        : data;

    filtered.forEach(note => {
        const card = document.createElement("div");
        card.className = `card ${note.color}`;
        card.innerHTML = `
            <h2>${note.title}</h2>
            <p>${note.date}</p>
            <p>${note.content}</p>

            <button class="edit" data-id="${note.id}">
                Edit
            </button>

            <button class="delete" data-id="${note.id}">
                Delete
            </button>
        `;
        grid.appendChild(card);
    });
}

grid.addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit")) {
        const id = e.target.dataset.id; 
        await editNote(id);
    }

    if (e.target.classList.contains("delete")) {
        const id = e.target.dataset.id;
        await deleteNote(id);
    }
});

async function deleteNote(id) {
    console.log("Attempting to delete id:", id);
    const { data, error } = await supabaseClient.from("notes").delete().eq("id", id);
    console.log("Delete response:", { data, error });
    if (error) {
        alert("Delete failed: " + error.message);
        return;
    }
    await renderNotes();
}

async function editNote(id) {
    console.log("Attempting to fetch id:", id);
    const { data, error } = await supabaseClient.from("notes").select("*").eq("id", id).single();
    console.log("Edit fetch response:", { data, error });

    if (error || !data) {
        alert("Note not found — check console for details: " + (error ? error.message : "no data"));
        return;
    }

    editingId = id;
    noteTitleInput.value = data.title;
    noteContentInput.value = data.content;
    noteColorInput.value = data.color;
    noteForm.style.display = "flex";
}

input.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    renderNotes(searchTerm);
});

renderNotes();