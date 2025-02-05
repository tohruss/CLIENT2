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
            placeholder="Введите задачи" 
            @keyup.enter="addTask"
        />
        <button @click="addTask" :disabled="card.tasks.length >= 5">Добавить</button>
        <p v-if="card.tasks.length < 3" style="color: red;">Вам нужно добавить минимум 3 задачи!</p>
        <p v-if="card.tasks.length >= 5" style="color: red;">Вы можете добавить не более 5 задач!</p>
    </div>
    `,
    data() {
        return {
            newTask: ''
        };
    },
    methods: {
        addTask() {
            if (this.card.tasks.length < 5 ) {
                this.card.tasks.push({ text: this.newTask, completed: false });
                this.newTask = '';
                this.saveTasks();
            }
        },
        saveTasks(){
            const cards = JSON.parse(localStorage.getItem('cards')) || [];
            const cardIndex = this.$parent.cards.indexOf(this.card);
            cards[cardIndex] = this.card;
            localStorage.setItem('cards', JSON.stringify(cards));
        },
    },
    mounted() {
        const cards = JSON.parse(localStorage.getItem('cards')) || [];
        const cardIndex = this.$parent.cards.indexOf(this.card);
        if (cards[cardIndex]) {
            this.card.tasks = cards[cardIndex].tasks;
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
            if (this.newCardTitle) {
                this.cards.push({ title: this.newCardTitle, tasks: [] });
                this.newCardTitle = ''; // Очистка поля ввода заголовка
                this.saveCards();
            }
        },
        saveCards() {
            localStorage.setItem('cards', JSON.stringify(this.cards));
        },
        deleteAllCards() {
            this.cards = [];
            localStorage.removeItem('cards');
        }
    },
    mounted() {
        // Загружаем карточки при монтировании
        const savedCards = JSON.parse(localStorage.getItem('cards'));
        if (savedCards) {
            this.cards = savedCards;
        }
    },
    template: `
    <div class="app">
        <input 
            type="text" 
            v-model="newCardTitle" 
            placeholder="Введите название карточки" 
        />
        <button @click="addCard">Добавить карточку</button>
        <button @click="deleteAllCards">Удалить все карточки</button>
        <div v-for="(card, index) in cards" :key="index">
            <task-card :card="card"></task-card>
        </div>
    </div>
    `
});
