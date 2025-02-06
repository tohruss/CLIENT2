Vue.component('task-card', {
    props: ['card', 'currentColumnIndex', 'isFirstColumnLocked'],
    template: `
    <div class="task-card">
        <h3>Задача: {{ card.title }}</h3>
        <ul v-if="card.tasks && card.tasks.length > 0">
            <li v-for="(task, index) in card.tasks" :key="index">
                <input 
                    type="checkbox" 
                    v-model="task.completed" 
                    :disabled="currentColumnIndex === 2 || (currentColumnIndex === 0 && isFirstColumnLocked)" 
                    @change="checkCompletion"
                />
                {{ task.text }}
                <span v-if="task.completed" style="color: green">(ВЫПОЛНЕННО)</span>
            </li>
        </ul>
        <div v-if="!currentColumnIndex && !isFirstColumnLocked">
            <input 
                type="text" 
                v-model="newTask" 
                placeholder="Введите задачи" 
                @keyup.enter="addTask"
            />
            <button @click="addTask" :disabled="card.tasks.length >= 5">Добавить</button>
        </div>
        <div v-if="!currentColumnIndex && !isFirstColumnLocked">
            <p v-if="card.tasks.length < 3" style="color: red;">Вам нужно добавить минимум 3 задачи!</p>
            <p v-if="card.tasks.length >= 5" style="color: red;">Вы можете добавить не более 5 задач!</p>
        </div>
        <p v-if="card.finalMoved && card.lastUpdated" style="font-weight: bold">Выполнено: {{ card.lastUpdated }}</p>
    </div>
    `,
    data() {
        return {
            newTask: ''
        };
    },
    methods: {
        addTask() {
            if (!this.card.tasks) {
                this.card.tasks = []; // Инициализация tasks, если он undefined
            }
            if (this.card.tasks.length < 5 && this.newTask) {
                this.card.tasks.push({ text: this.newTask, completed: false });
                this.newTask = '';
                this.saveTasks();
            }
        },
        saveTasks() {
            const cards = JSON.parse(localStorage.getItem('cards')) || [];
            const cardIndex = cards.findIndex(c => c.id === this.card.id); // Ищем карточку по id

            // Сохраняем актуальные данные с состоянием задач
            if (cardIndex !== -1) {
                cards[cardIndex] = {
                    ...this.card,
                    tasks: this.card.tasks.map(task => ({ ...task })) // Глубокая копия задач
                };
            } else {
                cards.push({
                    ...this.card,
                    tasks: this.card.tasks.map(task => ({ ...task }))
                });
            }

            localStorage.setItem('cards', JSON.stringify(cards));
        },
        checkCompletion() {
            if (this.card.tasks) {
                const totalTasks = this.card.tasks.length;
                const completedTasks = this.card.tasks.filter(task => task.completed).length;

                if (totalTasks > 0) {
                    const completionRate = (completedTasks / totalTasks) * 100;

                    // Перемещение карточки вперед
                    if (completionRate > 50 && completionRate <= 100) {
                        this.$emit('move-to-next', this.card, this.currentColumnIndex);
                    } else if (completionRate === 100) {
                        this.card.lastUpdated = new Date().toLocaleString(); // Установка времени последнего обновления
                        this.$emit('move-to-next', this.card, this.currentColumnIndex);
                    }

                    // Перемещение карточки назад
                    if (completionRate <= 50 && this.currentColumnIndex === 1) {
                        this.$emit('move-to-previous', this.card, this.currentColumnIndex);
                    }

                    this.saveTasks();
                }
            }
        }
    },
    mounted() {
        const cards = JSON.parse(localStorage.getItem('cards')) || [];
        const savedCard = cards.find(c => c.id === this.card.id); // Ищем сохранённую карточку по id

        if (savedCard && savedCard.tasks) {
            this.card.tasks = savedCard.tasks.map(task => ({ ...task })); // Глубокая копия задач
        } else {
            this.card.tasks = []; // Инициализация пустого массива задач
        }
    }
});

Vue.component('column1', {
    props: ['cards', 'isFirstColumnLocked'],
    template: `
    <div class="column">
        <h2>Новые задачи</h2>
        <task-card 
            v-for="(card, index) in cards" 
            :key="index" 
            :card="card"
            :currentColumnIndex="0"
            :isFirstColumnLocked="isFirstColumnLocked"
            @move-to-next="moveToNext"
            @move-to-previous="moveToPrevious"
        ></task-card>
    </div>
    `,
    methods: {
        moveToNext(card, currentColumnIndex) {
            this.$emit('move-to-next', card, currentColumnIndex);
        },
        moveToPrevious(card, currentColumnIndex) {
            this.$emit('move-to-previous', card, currentColumnIndex);
        }
    }
});

Vue.component('column2', {
    props: ['cards'],
    template: `
    <div class="column">
        <h2>Задачи в процессе</h2>
        <task-card 
            v-for="(card, index) in cards" 
            :key="index" 
            :card="card" 
            :currentColumnIndex="1"
            @move-to-next="moveToNext"
            @move-to-previous="moveToPrevious"
        ></task-card>
    </div>
    `,
    methods: {
        moveToNext(card, currentColumnIndex) {
            this.$emit('move-to-next', card, currentColumnIndex);
        },
        moveToPrevious(card, currentColumnIndex) {
            this.$emit('move-to-previous', card, currentColumnIndex);
        }
    }
});

Vue.component('column3', {
    props: ['cards'],
    template: `
    <div class="column">
        <h2>Выполненные задачи</h2>
        <task-card 
            v-for="(card, index) in cards" 
            :key="index" 
            :card="card"
            :currentColumnIndex="2"
        ></task-card>
    </div>
    `
});

new Vue({
    el: '#app',
    data() {
        return {
            cards: [],
            newCardTitle: '',
            isFirstColumnLocked: false // Состояние блокировки первой колонки
        };
    },
    computed: {
        // Проверяем, заполнена ли вторая колонка
        isSecondColumnFull() {
            return this.cards.filter(card => card.moved && !card.finalMoved).length >= 5;
        }
    },
    methods: {
        addCard() {
            const cardsInFirstColumn = this.cards.filter(card => !card.moved).length; // кол-во первой колонки

            if (this.newCardTitle) {
                // В первой колонне не более 3 карточек
                if (cardsInFirstColumn < 3) {
                    this.cards.push({
                        title: this.newCardTitle,
                        id: Date.now(),
                        tasks: [],
                        moved: false,
                        finalMoved: false,
                        lastUpdated: null
                    });

                    this.newCardTitle = ''; // Очистка поля ввода заголовка
                    this.saveCards();
                } else {
                    alert('В первой колонне может быть не более 3 карточек.');
                }
            }
        },
        saveCards() {
            localStorage.setItem('cards', JSON.stringify(this.cards));
        },
        deleteAllCards() {
            this.cards = [];
            localStorage.removeItem('cards');
        },
        moveCardToNext(card, currentColumnIndex) {
            const cardIndex = this.cards.indexOf(card);

            if (cardIndex !== -1 && card.tasks) {
                const completedTasks = card.tasks.filter(task => task.completed).length;
                const totalTasks = card.tasks.length;

                // Проверяем, заполнена ли вторая колонка
                if (currentColumnIndex === 0 && completedTasks > totalTasks / 2 && this.isSecondColumnFull) {
                    this.isFirstColumnLocked = true; // Блокируем первую колонку
                    alert('Во второй колонне может быть не более 5 карточек. Первая колонка заблокирована.');
                    return;
                }

                if (completedTasks > totalTasks / 2 && currentColumnIndex < 2) {
                    card.moved = true;
                    if (completedTasks === totalTasks) {
                        card.finalMoved = true;
                        card.lastUpdated = new Date().toLocaleString();
                        this.isFirstColumnLocked = false; // Разблокируем первую колонку
                    }
                    this.saveCards();
                }
            }
        },
        moveCardToPrevious(card, currentColumnIndex) {
            const cardIndex = this.cards.indexOf(card);

            if (cardIndex !== -1 && card.tasks) {
                const completedTasks = card.tasks.filter(task => task.completed).length;
                const totalTasks = card.tasks.length;

                if (completedTasks <= totalTasks / 2 && currentColumnIndex > 0) {
                    card.moved = false;
                    if (currentColumnIndex === 2) {
                        card.finalMoved = false;
                        card.lastUpdated = null;
                    }
                    this.saveCards();
                }
            }
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
        <div class="navmenu">
            <input 
                type="text" 
                v-model="newCardTitle" 
                placeholder="Введите название карточки" 
            />
            <button @click="addCard" :disabled="cards.filter(card => !card.moved).length >= 3 || isFirstColumnLocked">Добавить карточку</button>
            <button class="DELITE" @click="deleteAllCards">Удалить все карточки</button>
        </div>
        <div class="tables">
            <column1 
                :cards="cards.filter(card => !card.moved)" 
                :isFirstColumnLocked="isFirstColumnLocked" 
                @move-to-next="moveCardToNext"
                @move-to-previous="moveCardToPrevious"
            ></column1>
            <column2 
                :cards="cards.filter(card => card.moved && !card.finalMoved)" 
                @move-to-next="moveCardToNext"
                @move-to-previous="moveCardToPrevious"
            ></column2>
            <column3 
                :cards="cards.filter(card => card.finalMoved)"
            ></column3>
        </div>
    </div>
    `
});