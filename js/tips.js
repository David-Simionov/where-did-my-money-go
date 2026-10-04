// ============ СОВЕТИ ПО КАТЕГОРИЈА ============
// Општи идеи, не финансиски совет. Дополни ги со локални примери што ги знаеш.
const TIPS = {
    Food: {
        en: [
            "Set a weekly budget for eating out and track it. Seeing the number is half the work.",
            "Order delivery less often: delivery fees and menu markups add up. Pick up yourself when you can.",
            "Make lunch at home 2-3 days a week and keep restaurants for planned occasions."
        ],
        mk: [
            "Постави неделен буџет за јадење надвор и следи го. Кога го гледаш бројот, половина од работата е готова.",
            "Нарачувај достава поретко: надоместоците и поскапите цени се собираат. Подигни сам кога можеш.",
            "Подготви ручек дома 2-3 дена неделно, а ресторан остави за планирани прилики."
        ]
    },
    Transport: {
        en: [
            "Combine errands into one trip to save fuel and time.",
            "Keep tires properly inflated and drive smoothly, it lowers fuel use. Ask if your station has a loyalty discount.",
            "For short trips, walk or cycle. For regular routes, compare a monthly pass or carpooling with paying per ride."
        ],
        mk: [
            "Здружи ги обврските во една вожња за да штедиш гориво и време.",
            "Одржувај го притисокот во гумите и вози мазно, така се намалува потрошувачката. Прашај дали бензинската станица нуди попуст за лојални клиенти.",
            "За кратки релации оди пеш или со велосипед. За редовни релации спореди месечна карта или заеднички превоз со плаќање по вожња."
        ]
    },
    Groceries: {
        en: [
            "Make a list before you go and stick to it. Unplanned items are where the budget leaks.",
            "Check weekly store leaflets and compare prices for the 5-10 items you buy most.",
            "Do not shop hungry, and cook larger portions so you have leftovers for the next day."
        ],
        mk: [
            "Направи листа пред да одиш и држи се до неа. Непланираните артикли се местото каде бегаат парите.",
            "Прегледај ги неделните проспекти и спореди цени за 5-10 артикли што најчесто ги купуваш.",
            "Не оди на пазар гладен, а готви поголеми порции за да ти остане за утредента."
        ]
    },
    Housing: {
        en: [
            "Check your bills for fixed fees or services you do not use, and ask providers for a cheaper plan.",
            "Cut standby use: switch devices off at the plug, use LED bulbs and heat only the rooms you use.",
            "If you have a two-tariff meter, run the washing machine and other big appliances in the cheaper tariff."
        ],
        mk: [
            "Провери ги сметките за фиксни надоместоци или услуги што не ги користиш и прашај ги давателите за поевтин пакет.",
            "Намали ја потрошувачката во мирување: исклучувај ги уредите од струја, користи LED сијалици и греј само простории што ги користиш.",
            "Ако имаш двотарифно броило, пушти ја машината за перење и другите поголеми апарати во пониската тарифа."
        ]
    },
    Shopping: {
        en: [
            "Wait 24 hours before buying anything non-essential. Many impulse purchases disappear on their own.",
            "Keep a wish list and compare prices across 2-3 shops before you buy.",
            "Look for seasonal sales and second-hand options for clothes, electronics and furniture."
        ],
        mk: [
            "Почекај 24 часа пред да купиш нешто што не е неопходно. Многу импулсивни купувања сами поминуваат.",
            "Води листа на желби и спореди цени во 2-3 продавници пред да купиш.",
            "Следи сезонски распродажби и размисли за половни работи кај облека, електроника и мебел."
        ]
    },
    Entertainment: {
        en: [
            "Pick one or two paid activities per month and fill the rest with free ones: parks, events, a game night at home.",
            "Check for student or off-peak discounts before buying tickets.",
            "Set a fixed amount for nights out and use a separate card, so you can see when it is gone."
        ],
        mk: [
            "Избери една-две платени активности месечно, а остатокот пополни го со бесплатни: паркови, настани, друштвени игри дома.",
            "Провери дали има попуст за студенти или за помалку посетени термини пред да купиш карти.",
            "Одреди фиксен износ за излегување и користи посебна картичка, за да видиш кога ќе заврши."
        ]
    },
    Subscriptions: {
        en: [
            "List every subscription and cancel the ones you have not used in the last month.",
            "Share family or duo plans with people you trust instead of paying for separate accounts.",
            "Check whether an annual plan is cheaper than paying monthly, and set a reminder before free trials end."
        ],
        mk: [
            "Направи листа на сите претплати и откажи ги оние што не си ги користел последниот месец.",
            "Дели семејни или дуо пакети со луѓе на кои им веруваш наместо да плаќаш одделни сметки.",
            "Провери дали годишниот план е поевтин од месечниот и постави потсетник пред да заврши бесплатниот пробен период."
        ]
    },
    Health: {
        en: [
            "Ask your pharmacist whether a cheaper generic version of your medicine exists.",
            "Use preventive care (regular checkups, dental cleaning). Small problems are cheaper to fix early.",
            "Compare prices for tests and treatments between a few providers before booking."
        ],
        mk: [
            "Прашај го фармацевтот дали постои поевтина генеричка верзија на лекот.",
            "Користи превентивна грижа (редовни прегледи, чистење на заби). Малите проблеми се поевтини ако се решат рано.",
            "Спореди цени за анализи и третмани кај неколку даватели пред да закажеш."
        ]
    },
    Education: {
        en: [
            "Look for free or low-cost options first: library books, free course platforms, recorded lectures.",
            "Buy second-hand textbooks or share them with classmates.",
            "Before paying for a course, check reviews and whether you will really finish it. Unused courses are wasted money."
        ],
        mk: [
            "Прво барај бесплатни или поевтини опции: книги од библиотека, платформи со бесплатни курсеви, снимени предавања.",
            "Купувај половни учебници или дели ги со колеги.",
            "Пред да платиш курс, провери ги критиките и дали навистина ќе го завршиш. Неискористените курсеви се фрлени пари."
        ]
    },
    Travel: {
        en: [
            "Book early and compare flexible dates: one day earlier or later can change the price a lot.",
            "Set a price alert for flights and stays, and travel outside peak season when you can.",
            "Decide on a daily budget before the trip, and check what is included in the price of the stay."
        ],
        mk: [
            "Резервирај рано и спореди флексибилни датуми: еден ден порано или подоцна може многу да ја смени цената.",
            "Постави известување за цена за летови и сместување и патувај надвор од сезона кога можеш.",
            "Одреди дневен буџет пред патувањето и провери што е вклучено во цената на сместувањето."
        ]
    },
    Cash: {
        en: [
            "Decide what the cash is for before you withdraw, and withdraw only that amount.",
            "Record each cash purchase right after paying, with its real category and payment set to Cash. Otherwise it disappears from your overview.",
            "Try paying by card for a month. The statement then shows where the money goes."
        ],
        mk: [
            "Одлучи за што ти е готовината пред да подигнеш и подигни само толку.",
            "Запиши ја секоја купувачка со готовина веднаш по плаќањето, со вистинската категорија и плаќање „Готовина“. Инаку исчезнува од прегледот.",
            "Пробај еден месец да плаќаш со картичка. Тогаш изводот покажува каде одат парите."
        ]
    },
    Other: {
        en: [
            "Open the biggest items in this category and give them a proper category. A large Other hides the real picture.",
            "Check the amounts that repeat: they may be subscriptions or fees you forgot about.",
            "Set a small monthly limit for this category in Budget, so it cannot quietly grow."
        ],
        mk: [
            "Отвори ги најголемите ставки во оваа категорија и дај им вистинска категорија. Голема категорија „Друго“ ја крие вистинската слика.",
            "Провери ги износите што се повторуваат: може да се претплати или такси што си ги заборавил.",
            "Постави мал месечен лимит за оваа категорија во Буџет за да не расте тивко."
        ]
    }
};