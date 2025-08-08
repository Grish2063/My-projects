document.addEventListener('DOMContentLoaded', () => {
  const task = document.getElementById("task-input");
  const addtaskbtn = document.getElementById("add-task-btn");
  const tasklist = document.getElementById("task-list");
  const emptyimage = document.querySelector(".empty-image");
  const todolist = document.querySelector(".todos-container");
  const progress = document.getElementById("progress");
  const progressNumbers = document.getElementById("numbers");
  
  let confettiFired = false;

  const toggleEmptyState = () => {
    emptyimage && (emptyimage.style.display = tasklist.querySelectorAll("li").length === 0 ? 'block' : 'none');
    todolist.style.width = tasklist.querySelectorAll("li").length > 0 ? '100%' : '50%';
  };

  const updateProgress = () => {
    const totaltasks = tasklist.querySelectorAll("li").length;
    const completedtasks = tasklist.querySelectorAll(".checkbox:checked").length;

    progress.style.width = totaltasks ? `${(completedtasks / totaltasks) * 100}%` : '0%';
    progressNumbers.textContent = `${completedtasks} / ${totaltasks}`;

    if (totaltasks > 0 && completedtasks === totaltasks) {
      if (!confettiFired) {
        launchconfetti();
        confettiFired = true;
      }
    } else {
      confettiFired = false;
    }
  };

  const addtask = (event) => {
    event.preventDefault();
    const tasktext = task.value.trim();
    if (!tasktext) return;

    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" class="checkbox">
      <span>${tasktext}</span>
      <div class="task-buttons">
        <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    const checkbox = li.querySelector('.checkbox');
    const editbtn = li.querySelector(".edit-btn");

    checkbox.addEventListener("change", () => {
      const isChecked = checkbox.checked;
      li.classList.toggle("completed", isChecked);
      editbtn.disabled = isChecked;
      editbtn.style.opacity = isChecked ? '0.5' : '1';
      editbtn.style.pointerEvents = isChecked ? "none" : "auto";
      updateProgress();
    });

    editbtn.addEventListener("click", () => {
      if (!checkbox.checked) {
        task.value = li.querySelector("span").textContent;
        li.remove();
        toggleEmptyState();
        updateProgress();
      }
    });

    li.querySelector('.delete-btn').addEventListener('click', () => {
      li.remove();
      toggleEmptyState();
      updateProgress();
    });

    tasklist.appendChild(li);
    task.value = '';
    toggleEmptyState();
    updateProgress();
  };

  addtaskbtn.addEventListener("click", addtask);
  task.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addtask(e);
    }
  });

  toggleEmptyState();
  updateProgress();
});

const launchconfetti = () => {
  const count = 200,
    defaults = {
      origin: { y: 0.7 },
    };

  function fire(particleRatio, opts) {
    confetti(
      Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio),
      })
    );
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

