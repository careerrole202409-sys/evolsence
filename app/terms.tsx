import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
<TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
  <Ionicons name="arrow-back" size={24} color="#fff" />
</TouchableOpacity>
        <Text style={styles.headerTitle}>利用規約</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
          この利用規約（以下「本規約」）は、Evolsence（以下「当運営」）が提供する本サービス「Evolsence」（以下「本サービス」）の利用条件を定めるものです。利用者の皆さま（以下「ユーザー」）には、本規約に従って本サービスをご利用いただきます。{"\n\n"}

          <Text style={styles.heading}>第1条（目的）{"\n"}</Text>
          本規約は、本サービスの利用に関する当運営とユーザーとの間の権利義務関係を定めることを目的とします。{"\n\n"}

          <Text style={styles.heading}>第2条（定義）{"\n"}</Text>
          1. 「ユーザー」とは、本規約に同意の上、本サービスを利用する個人または法人を指します。{"\n"}
          2. 「投稿コンテンツ」とは、ユーザーが本サービス上に投稿したテキスト、画像、動画等を指します。{"\n\n"}

          <Text style={styles.heading}>第3条（本サービスの内容）{"\n"}</Text>
          本サービスは、ユーザー間のコミュニケーションを促進するソーシャルネットワークサービスです。{"\n\n"}

          <Text style={styles.heading}>第4条（本サービスの停止）{"\n"}</Text>
          当運営は、保守点検、システムの故障、天災地変等の理由により、ユーザーに通知することなく本サービスの全部または一部の提供を停止できるものとします。{"\n\n"}

          <Text style={styles.heading}>第5条（ユーザー登録）{"\n"}</Text>
          1. 本サービスの利用を希望する者は、本規約に同意の上、当運営の定める方法によって登録を申請するものとします。{"\n"}
          2. ユーザーは、登録情報に変更があった場合、速やかに修正を行うものとします。{"\n\n"}

          <Text style={styles.heading}>第6条（知的財産権）{"\n"}</Text>
          1. ユーザーが投稿したコンテンツの著作権は、当該ユーザーに帰属します。{"\n"}
          2. ユーザーは当運営に対し、本サービスの提供・広告宣伝・改善に必要な範囲内で、投稿コンテンツを無償かつ非独占的に利用する権利を許諾するものとします。{"\n\n"}

          <Text style={styles.heading}>第7条（禁止事項）{"\n"}</Text>
          ユーザーは、以下に該当する行為を行ってはなりません。{"\n"}
          - 法令または公序良俗に反する行為{"\n"}
          - 他のユーザーに対する誹謗中傷、脅迫、ハラスメント行為{"\n"}
          - 当運営のサーバーやネットワーク機能を破壊・妨害する行為{"\n"}
          - スパム行為や不正な宣伝活動{"\n"}
          - その他、当運営が不適切と判断する行為{"\n\n"}

          <Text style={styles.heading}>第8条（解除・利用制限）{"\n"}</Text>
          当運営は、ユーザーが本規約に違反した場合、事前の通知なく当該ユーザーの投稿を削除し、またはアカウントを停止・解除することができるものとします。{"\n\n"}

          <Text style={styles.heading}>第9条（免責事項）{"\n"}</Text>
          1. 当運営は、本サービスの内容について、正確性、完全性、有用性を保証するものではありません。{"\n"}
          2. 本サービスの利用に関連して生じたユーザー間または第三者とのトラブルについて、当運営は一切の責任を負いません。{"\n\n"}

          <Text style={styles.heading}>第10条（広告主との取引）{"\n"}</Text>
          本サービス内に表示される広告主との取引は、ユーザーと当該広告主の責任において行うものとします。当運営は、広告掲載によるいかなる損害についても責任を負いません。{"\n\n"}

          <Text style={styles.heading}>第11条（損害賠償）{"\n"}</Text>
          ユーザーが本規約に違反して当運営に損害を与えた場合、当該ユーザーは当運営に対し、その損害を賠償しなければなりません。{"\n\n"}

          <Text style={styles.heading}>第12条（通信機器・費用負担）{"\n"}</Text>
          本サービスを利用するために必要な端末、通信機器、ソフトウェア、および通信料は、ユーザーの負担と責任において準備するものとします。{"\n\n"}

          <Text style={styles.heading}>第13条（本サービスの変更・廃止）{"\n"}</Text>
          当運営は、ユーザーに通知することなく、本サービスの内容を変更し、または提供を中止・廃止することができるものとします。{"\n\n"}

          <Text style={styles.heading}>第14条（反社会的勢力の排除）{"\n"}</Text>
          ユーザーは、自身が暴力団等の反社会的勢力に該当しないこと、および将来にわたっても該当しないことを表明し、保証するものとします。{"\n\n"}

          <Text style={styles.heading}>第15条（個人情報の取扱い）{"\n"}</Text>
          本サービスにおける個人情報の取扱いは、別途定める「プライバシーポリシー」に従うものとします。{"\n\n"}

          <Text style={styles.heading}>第16条（地位の譲渡）{"\n"}</Text>
          ユーザーは、利用契約上の地位または権利義務を第三者に譲渡し、または担保に供することはできません。{"\n\n"}

          <Text style={styles.heading}>第17条（準拠法・裁判管轄）{"\n"}</Text>
          1. 本規約の解釈にあたっては、日本法を準拠法とします。{"\n"}
          2. 本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。{"\n\n"}

          <Text style={styles.heading}>第18条（連絡・通知）{"\n"}</Text>
          本サービスに関するお問い合わせ、通知または連絡は、以下の窓口までお願いいたします。{"\n"}
          メールアドレス：contact@evolsence.com{"\n\n"}

          <Text style={styles.heading}>附則{"\n"}</Text>
          2026年1月31日 制定
        </Text>
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    height: 100, paddingTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#111'
  },
  backButton: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  text: { color: '#ccc', fontSize: 14, lineHeight: 24 },
  heading: { fontWeight: 'bold', color: '#fff', fontSize: 16, marginTop: 15 }
});