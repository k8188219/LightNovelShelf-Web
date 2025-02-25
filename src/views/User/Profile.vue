<template>
  <q-page padding>
    <div class="list-card" style="max-width: 900px">
      <div class="q-gutter-md">
        <div class="h2 title"> 个人资料 </div>

        <q-list class="card" bordered separator>
          <template v-for="option in profileListOptions" :key="option.key">
            <q-item clickable v-ripple active-class="bg-teal-1 text-grey-8" @click="option.onClick">
              <q-item-section class="avatar-item" avatar>
                <q-avatar>
                  <q-img v-if="option.key === 'Avatar'" :src="user?.[option.key]" spinner-color="primary" />
                  <q-icon v-else :name="option.icon" />
                </q-avatar>
              </q-item-section>
              <q-item-section class="label-item">{{ option.label }}</q-item-section>
              <q-item-section side v-if="!['Avatar'].includes(option.key)">
                {{ option.value ? option.value(user) : user?.[option.key] }}
              </q-item-section>
              <q-item-section side v-if="option.editable">
                <q-icon size="18px" :name="icon.mdiChevronRight" />
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </div>
    </div>

    <q-dialog ref="dialog" v-model="visible" persistent>
      <q-card style="min-width: 350px">
        <q-form @submit="handleSubmit">
          <q-card-section>
            <div class="text-h6">修改头像</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-select
              v-model="urlType"
              emit-value
              map-options
              :options="[
                { label: '普通URL', value: 0 },
                { label: 'QQ头像', value: 1 }
              ]"
              @update:model-value="avatarUrl = ''"
            />
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              dense
              v-model="avatarUrl"
              bottom-slots
              :placeholder="urlType === 1 ? '请输入QQ号' : '请输入图片URL'"
              :rules="
                urlType === 1
                  ? [(val) => qqReg.test(val) || '请输入正确的 QQ 号']
                  : [(val) => httpsReg.test(val) || '请输入正确的图片URL']
              "
            >
              <template v-slot:hint>
                <span v-if="urlType === 1">使用此功能会导致你的 QQ 号暴露，但可以实时同步你的 QQ 头像</span>
                <span v-else>图片 URL 仅支持 https</span>
              </template>
            </q-input>
          </q-card-section>

          <q-card-actions align="right" class="text-primary">
            <q-btn flat label="取消" v-close-popup />
            <q-btn flat label="确定" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { icon } from 'assets/icon'
import { useAppStore } from 'stores/app'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import { setAvatar, getMyInfo } from 'src/services/user'
import { getErrMsg } from 'src/utils/getErrMsg'
import { parseTime } from 'src/utils/time'
const avatar = computed(() => appStore.avatar)

defineComponent({ name: 'Profile' })

const $q = useQuasar()
const appStore = useAppStore()
const { user } = storeToRefs(appStore)

/** 是否展示对话框 */
const visible = ref(false)
const urlType = ref(0)
const avatarUrl = ref('')

const httpsReg = /https:\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/
const qqReg = /^[1-9]\d{4,}$/
const qqAvatarReg = /https:\/\/q.qlogo.cn\/headimg_dl\?spec=100&dst_uin=/
const qqAvatarUrl = 'https://q.qlogo.cn/headimg_dl?spec=100&dst_uin='
const profileListOptions: Array<Record<string, any>> = [
  {
    label: '头像',
    key: 'Avatar',
    editable: true,
    onClick: () => (visible.value = true)
  },
  {
    label: 'UID',
    key: 'Id',
    icon: icon.mdiCalendarAccount
  },
  {
    label: '昵称',
    key: 'UserName',
    icon: icon.mdiCalendarAccount
    // editable: true,
    // onClick: changeUsername
  },
  {
    label: 'Email',
    key: 'Email',
    icon: icon.mdiEmail
  },
  {
    label: '用户组',
    key: 'UserGroup',
    value: (u) => u?.Role.Name,
    icon: icon.mdiAccountSupervisor
  },
  {
    label: '积分',
    key: 'Point',
    value: (u) => 0,
    icon: icon.mdiTicketConfirmation
  },
  {
    label: '注册时间',
    key: 'RegisterTime',
    value: (u) => (u?.RegisterTime ? parseTime(u.RegisterTime).toFormat('yyyy-MM-dd') : null),
    icon: icon.mdiCalendarRangeOutline
  }
]

async function handleSubmit() {
  let avatarVal = ''

  // 图片输入类型
  if (urlType.value === 0) {
    avatarVal = avatarUrl.value
  } else {
    avatarVal = `${qqAvatarUrl}${avatarUrl.value}`
  }

  try {
    await setAvatar(avatarVal)
    appStore.user = await getMyInfo()
    visible.value = false // 关闭弹窗

    $q.notify({
      type: 'positive',
      message: '修改成功'
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: getErrMsg(err)
    })
  }
}

watch(visible, (newVisible) => {
  if (newVisible) {
    if (qqAvatarReg.test(avatar.value)) {
      urlType.value = 1
      avatarUrl.value = avatar.value.replace(qqAvatarUrl, '')
    } else {
      urlType.value = 0
      avatarUrl.value = avatar.value
    }
  } else {
    urlType.value = 0
    avatarUrl.value = ''
  }
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.list-card {
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 0 auto;

  .card {
    border-radius: 4px;
  }
}
</style>
