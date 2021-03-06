/* globals Session, ReactMeteorData */

App.initialBatchSize = 48
App.defaultSortDirection = -1 // descending sort by default
App.defaultSortType = 'row_nr'//'last_update'

let chunkSize = 24 // must be % 12 == 0, how many blocks are added
let blocksInAdvance = 6 // if the browser is this close to the bottom we will load more

if (typeof Session !== 'undefined') {
  Session.set('searchQuery', '')
  Session.set('searchSortDirection', App.defaultSortDirection)
  Session.set('searchSortType', App.defaultSortType)
  Session.set('lastResult', App.initialBatchSize)
}

if (Meteor.isClient) {
  let $window = $(window)
}

App.projectsList = React.createClass({
  // This mixin makes the getMeteorData method work
  mixins: [ReactMeteorData],
  // fields in mongo to use in search query
  searchFields: ['name', 'description', 'twitter', 'contact', 'license', 'status'],
  // Loads items from the projects collection and puts them on this.data.projects
    statics : {
      getProjectCount()
      {
          //used for the InfoModal page whereby the dapp count is needed to price the top listing
          let data = new App.projectsList;
          return data.getMeteorData().count;
      }
    },
    getMeteorData () {
        let data = {};
        let query = {};
        let sort = {};
        sort[App.defaultSortType] = App.defaultSortDirection;
        let limit = App.initialBatchSize;
        let searchQuery = '';
        // subscribe to the data source, server and client
        Meteor.subscribe('projects');
        // CLIENT ONLY
        if (typeof Session !== 'undefined') {
            // Use the search query if one exists
            searchQuery = Session.get('searchQuery') || '';
            //limit = Session.get('lastResult');
            sort = {};
            sort[Session.get('searchSortType')] = Session.get('searchSortDirection');
            // the defaultSortType will always remain as a 'secondary sort'
            sort[App.defaultSortType] = Session.get('searchSortDirection');

            // If the query is long enough, search regex pattern in all searchable fields
            if (searchQuery.length > 0) {
                query = {$or: []};
                for (let i = 0; i < this.searchFields.length; i++) {
                    let thisField = {};
                    thisField[this.searchFields[i]] = {$regex: searchQuery, $options: 'i'};
                    query.$or.push(thisField);
                }
            }
        }
        data.projects = App.cols.Projects.find(query, {sort: sort}).fetch()
        data.count = App.cols.Projects.find(query).count();
        data.resultType = searchQuery.length > 0 ? 'found' : 'listed';
        return data
    },

    // infinite scrolling
    // loadMoreItems ()
    // {
    //     let childCount = $('.col', this.refs.projectsection.getDOMNode()).size();
    //     let sessionGetLastResult = Session.get('lastResult');
    //     // don't try to load more items until we've matched the last request, or never fire if done
    //     if (childCount >= sessionGetLastResult) {
    //         Session.set('lastResult', sessionGetLastResult + chunkSize)
    //     }
    // },

    // handleScroll: _.debounce(function () {
    //     // get the position of `blocksInAdvance` blocks before it ends
    //     let $lastItem = $('.col:last-child', this.refs.projectsection.getDOMNode())
    //     let targetPosition = Math.round($lastItem.offset().top - ($lastItem.height() * blocksInAdvance))
    //     if ($window.scrollTop() + $window.height() >= targetPosition) {
    //         this.loadMoreItems()
    //     }
    // }, 200),
    //
    // componentDidUpdate () {
    //     // check to see if screen is fully populated
    //     let $lastItem = $('.col:last-child', this.refs.projectsection.getDOMNode())
    //     if ($lastItem.size() && Math.floor($lastItem.offset().top) + $lastItem.height() < $window.height()) {
    //         this.loadMoreItems()
    //     }
    // },

    componentDidMount () {
        window.addEventListener('scroll', this.handleScroll)
        this.componentDidUpdate()
    },

    componentWillUnmount () {
        window.removeEventListener('scroll', this.handleScroll)
    },

    scrollToTop () {
        window.scrollTo(0, 0)
    },

    renderprojects () {
        if (this.data.projects.length) {
            return this.data.projects.map(function (dapp) {
                return <App.Dapp
                    key={dapp._id}
                    dapp={dapp}/>
            })
        } else {
            return (
                <div className='no-results center-align white-text flow-text section'>
                  <p>No Projects Found</p>
                </div>
            )
        }
    },

    render () {
        return (
            <div>
              <div onClick={this.scrollToTop} className='scroll-to-top'>
                <i className='fa fa-fw fa-arrow-up'></i>
              </div>
              <div ref='navArea' className='header-container container'>
                <header className='center-align'>
                  <h1>Bitcoin Projects</h1>
                </header>
                <section>
                  < App.SearchBox />
                </section>
              </div>
              < App.InfoModal />

              <div className='black'>
                <div className='row'>
                  < App.FilterArea data={this.data}/>
                  <section ref='projectsection' className='projects row'>
                      {this.renderprojects()}
                  </section>
                </div>
                <footer className='white-text center-align'>
                  <div className='row'>
                    <div className='col s12 m4'>
                      As seen on <a target='_blank' href='https://bitcoin.org/en/resources'>Bitcoin.org</a>
                    </div>
                    <div className='col s12 m4'>
                      <a target='_blank' href='mailto:bitcoinsetupnz@gmail.com'>Contact Us</a>
                    </div>
                  </div>
                </footer>
              </div>

              < App.SubmitModal />
              < App.PricingModal />
            </div>
        )
    }
});
