use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Copy, Debug)]
pub enum SubscriptionType {
	Account = 0,
	Hub = 1,
}

impl Default for SubscriptionType {
	fn default() -> Self {
		SubscriptionType::Account
	}
}

#[account]
#[derive(Default)]
// size = 8 + 32 + 32 + 1 + 8(+ 40) = 121
pub struct Subscription {
    pub from: Pubkey,
    pub to: Pubkey,
    pub subscription_type: SubscriptionType,
		pub datetime: i64,
}

#[event]
pub struct SubscriptionSubscribed {
	#[index]
	pub public_key: Pubkey,
	pub from: Pubkey,
	pub to: Pubkey,
	pub subscription_type: SubscriptionType,
	pub datetime: i64,
}

#[event]
pub struct SubscriptionUnsubscribed {
	#[index]
	pub public_key: Pubkey,
}