/// <reference path="../typings/tsd.d.ts" />

module typewriter.line {

	interface ILine {
		text:string;
		result:string;
		delay:number;
		doneWritting:boolean;
	}

	class LineCtrl implements ILine {
		text:string;
		result:string = '';
		temp:string = '';
		delay:number;
		doneWritting:boolean = true;
		private textNode:Text;

		static $inject = ['$timeout', '$scope', '$element', '$document'];

		constructor(private $timeout:ng.ITimeoutService,
					private $scope:ng.IScope,
					private $element:ng.IAugmentedJQuery,
					private $document:ng.IDocumentService) {

			$scope.$watch(() => this.text, () => {
				this.temp = '';
				if (this.text != null) {
					this.$scope.$emit('TypewriterLine:start', this.doneWritting);
					this.doneWritting = false;
					this.print(this.text.split(''));
				}
			});

			this.$element.prepend(this.createTextNode());
		}

		private print(text:string[]):void {
			this.print = _.throttle((text:string[]) => {
				var letter = text.shift();
				//var delay = Math.round(Math.random() * this.delay);
				this.$timeout(() => {
					if (letter != null) {
						this.temp = this.temp + letter;
						this.print(text);
						this.refreshNode();
					} else {
						this.doneWritting = true;
						this.$scope.$emit('TypewriterLine:done', this.doneWritting);
					}
				});
			}, this.delay);
			this.print(text);
		}

		private createTextNode():Text {
			this.textNode = document.createTextNode('');
			return this.textNode
		}

		private refreshNode():void {
			this.textNode.nodeValue = this.temp;
		}
	}

	export class LineDirective implements ng.IDirective {
		restrict = 'E';
		scope = true;
		controller = LineCtrl;
		controllerAs = 'WL';
		bindToController = {
			text: '=',
			delay: '@?'
		};
		template = "<cursor ng-class='{active: !WL.doneWritting, last: $last}'>&nbsp;</cursor>";

		static Factory:ng.IDirectiveFactory = () => new LineDirective();
	}

	angular.module('touk.typewriter.line', ['touk.typewriter'])
		.directive("ttLine", LineDirective.Factory);
}