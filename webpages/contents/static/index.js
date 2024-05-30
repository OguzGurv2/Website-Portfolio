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

    const username = 'OguzGurv2';
    const token = '';
    
    const query = `
    {
      user(login: "${username}") {
        contributionsCollection(from: "2024-01-01T00:00:00Z", to: "2024-12-31T23:59:59Z") {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }`;
    
    async function fetchContributions() {
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });
    
      const { data } = await response.json();
      return data.user.contributionsCollection.contributionCalendar.weeks;
    }
    

    fetchContributions(username)
    .then(data => {
        const heatmapData = data.flatMap(week => week.contributionDays)
        .map(day => ({
          date: day.date,
          value: day.contributionCount
        }));

        const cal = new CalHeatmap();
        cal.paint(
        {
            data: {
                source: heatmapData,
                x: 'date',
                y: 'value',
            },
            date: { start: new Date('2024-01-01') },
            range: 12,
            scale: {
            color: {
                type: 'threshold',
                range: ['#ededed', '#4dd05a', '#37a446', '#166b34', '#14432a'],
                domain: [1, 3, 5, 7, 9],
            },
            },
            domain: {
            type: 'month',
            gutter: 1,
            label: { text: 'MMM', textAlign: 'start', position: 'bottom' },
            },
            subDomain: { type: 'ghDay', radius: 2, width: 11, height: 11, gutter: 1 },
            itemSelector: '#contributions-heatmap',
        },
        [
            [
            Tooltip,
            {
                text: function (date, value, dayjsDate) {
                return (
                    (value ? value : 'No') +
                    ' contributions on ' +
                    dayjsDate.format('dddd, MMMM D, YYYY')
                );
                },
            },
            ],
            [
            CalendarLabel,
            {
                width: 30,
                textAlign: 'start',
                text: () => dayjs.weekdaysShort().map((d, i) => (i % 2 == 0 ? '' : d)),
                padding: [0, 0, 0, 0],
            },
            ],
        ]
        );

    });
});
