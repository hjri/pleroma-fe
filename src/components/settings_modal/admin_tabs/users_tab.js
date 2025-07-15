//import get from 'lodash/get'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import withLoadMore from 'src/components/../hocs/with_load_more/with_load_more'
import SelectableList from 'src/components/selectable_list/selectable_list.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import AdminCard from 'src/components/settings_modal/admin_tabs/admin_card.vue'
//import  { ref } from 'vue'

const UserList = withLoadMore({
  fetch: (props, $store) => {
     console.log('fetch', props)
     return $store.dispatch('fetchAdminUsers')
  },
  select: (props, $store) => {
     console.log('select', props)
     const filterMethod = typeof props.filterMethod === 'function' ? props.filterMethod : () => true
     const users = $store.state.users.users.filter(user => user.id !== $store.state.users.currentUser.id && filterMethod(user))
     console.log('users', users)
     return users
  },
  destroy: () => {},
  childPropName: 'items'
})(SelectableList)

const UserSortStrategy = Object.freeze({
   NONE: 0,
   NICKNAME: 1,
   DISPLAYNAME: 2,
   JOINED: 3
})

const UsersTab = {
   provide () {
      return {
         defaultDraftMode: true,
         defaultSource: 'admin'
      }
   },
   data() {
      return {
         filterTerms: [],
         users: [],
         sortStrategy: UserSortStrategy.NONE,
         sortAscending: true,
         expandedUser: null,
         filterActive: 'active_only',
         filterLocal: 'local_only',
         loading: false
      }
   },
   components: {
      Checkbox,
      Select,
      BasicUserCard,
      UserList,
      ProgressButton, 
      AdminCard,
   },
   computed: {
   knownDomains () {
      return this.$store.state.instance.knownDomains
    },
    user () {
      return this.$store.state.users.currentUser
    }
   },
   methods: {
   },
   mounted() {
      console.log("mounted")
      /*const store = this.$store;
  const moduleTree = buildModuleTree(store._modules.root);
  console.log(JSON.stringify(moduleTree, null, 2));*/
   }
}
/*function buildModuleTree(module, path = []) {
  const fullPath = path.join('/') || 'root';

  const moduleInfo = {
    path: fullPath,
    namespaced: module.namespaced,
    state: Object.keys(module.state),
    actions: module._rawModule.actions ? Object.keys(module._rawModule.actions) : [],
    mutations: module._rawModule.mutations ? Object.keys(module._rawModule.mutations) : [],
    getters: module._rawModule.getters ? Object.keys(module._rawModule.getters) : [],
    modules: []
  };

  if (module._children) {
    for (const key in module._children) {
      const child = module._children[key];
      moduleInfo.modules.push(buildModuleTree(child, path.concat(key)));
    }
  }

  return moduleInfo;
}*/
export default UsersTab
