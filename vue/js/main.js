Vue.component('task-card', {
    props: ['card'],
    template: `
    <div class="task-card">
        <h3>{{ card.title }}</h3>
        <ul>
            <li v-for="(task, index) in card.tasks" :key="index">
                <input type="checkbox" v-model="task.completed">
                {{ task.text }}
                <span v-if="task.completed">(ВЫПОЛНЕННО)</span>
            </li>
        </ul>
        <input 
            type="text" 
            v-model="newTask" 
            placeholder="Enter a task" 
            @keyup.enter="addTask"
        />
        <button @click="addTask" :disabled="card.tasks.length >= 5">Add Task</button>
        <p v-if="card.tasks.length >= 5" style="color: red;">You can only add up to 5 tasks.</p>
    </div>
    `,
    data() {
        return {
            newTask: ''
        };
    },
    methods: {
        addTask() {
            if (this.newTask.trim() && this.card.tasks.length < 5) {
                this.card.tasks.push({ text: this.newTask, completed: false });
                this.newTask = '';
            }
        }
    }
});

new Vue({
    el: '#app',
    data() {
        return {
            cards: [],
            newCardTitle: ''
        };
    },
    methods: {
        addCard() {
            if (this.newCardTitle.trim()) {
                this.cards.push({ title: this.newCardTitle, tasks: [] });
                this.newCardTitle = ''; // Очистка поля ввода заголовка
            }
        }
    },
    template: `
    <div class="app">
        <input 
            type="text" 
            v-model="newCardTitle" 
            placeholder="Enter card title" 
        />
        <button @click="addCard">Add Task Card</button>
        
        <div v-for="(card, index) in cards" :key="index">
            <task-card :card="card"></task-card>
        </div>
    </div>
    `
});
